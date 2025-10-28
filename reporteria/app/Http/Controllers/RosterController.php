<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Services\RosterSyncService;

class RosterController extends Controller
{
    public function __construct(private RosterSyncService $sync) {}

    private function paginate(Request $req): array
    {
        $page     = max(1, (int)$req->query('page', 1));
        $pageSize = max(1, min(100, (int)$req->query('pageSize', 10)));
        $offset   = ($page - 1) * $pageSize;
        return [$page, $pageSize, $offset];
    }

    /**
     * GET /api/report/roster
     * Columnas UI: equipo, jugador, dorsal, posicion
     * Filtros:
     *   - partido_id=123  (convocados de ese partido)
     *   - desde=YYYY-MM-DD&hasta=YYYY-MM-DD  (por fecha del partido)
     */
    public function index(Request $req)
    {
        // 🔥 tiempo real (diff + delete)
        $this->sync->syncRosterDiffAndDelete();

        [$page, $pageSize, $offset] = $this->paginate($req);

        $partidoId = $req->query('partido_id'); // viene del combo “Filtrar roster por partidos”
        $desde     = $req->query('desde');      // fecha inicio (DATE de p.fecha_hora_inicio)
        $hasta     = $req->query('hasta');      // fecha fin

        // Base sobre tablas (para permitir filtrar por fecha del partido)
        $base = DB::connection('mysql')->table('bridge_roster_partido as rp')
            ->join('dim_jugador as j', 'j.jugador_id', '=', 'rp.jugador_id')
            ->join('dim_equipo  as e', 'e.equipo_id',  '=', 'rp.equipo_id')
            ->join('dim_partido as p', 'p.partido_id', '=', 'rp.partido_id')
            ->selectRaw("
                e.nombre AS equipo,
                CONCAT(j.nombres,' ',j.apellidos) AS jugador,
                j.dorsal,
                j.posicion
            ");

        if ($partidoId) {
            $base->where('rp.partido_id', (int)$partidoId);
        }
        if ($desde && $hasta) {
            $base->whereBetween(DB::raw('DATE(p.fecha_hora_inicio)'), [$desde, $hasta]);
        }

        // Conteo y página
        $total = (int) DB::connection('mysql')
            ->table(DB::raw("({$base->toSql()}) as t"))
            ->mergeBindings($base)
            ->count();

        $rows = (clone $base)
            ->orderBy('equipo')
            ->orderBy('dorsal')
            ->offset($offset)
            ->limit($pageSize)
            ->get();

        $columns = [
            ['key' => 'equipo',   'title' => 'equipo'],
            ['key' => 'jugador',  'title' => 'jugador'],
            ['key' => 'dorsal',   'title' => 'dorsal'],
            ['key' => 'posicion', 'title' => 'posicion'],
        ];

        return response()->json(compact('columns','rows','total','page','pageSize'));
    }

    /** GET /api/report/roster/pdf */
    public function pdf(Request $req)
    {
        // 🔁 tiempo real
        $this->sync->syncRosterDiffAndDelete();

        // Parámetros
        $all       = (int) $req->query('all', 0) === 1; // all=1 => sin paginar
        [$page, $pageSize, $offset] = $this->paginate($req);

        $partidoId = $req->query('partido_id');
        $desde     = $req->query('desde');
        $hasta     = $req->query('hasta');

        // Base con joins (igual que index), más datos para encabezado si se elige partido
        $q = DB::connection('mysql')->table('bridge_roster_partido as rp')
            ->join('dim_jugador as j', 'j.jugador_id', '=', 'rp.jugador_id')
            ->join('dim_equipo  as e', 'e.equipo_id',  '=', 'rp.equipo_id')
            ->join('dim_partido as p', 'p.partido_id', '=', 'rp.partido_id')
            ->leftJoin('dim_equipo as el', 'el.equipo_id', '=', 'p.equipo_local_id')
            ->leftJoin('dim_equipo as ev', 'ev.equipo_id', '=', 'p.equipo_visitante_id')
            ->selectRaw("
                e.nombre AS equipo,
                CONCAT(j.nombres,' ',j.apellidos) AS jugador,
                j.dorsal,
                j.posicion,
                p.partido_id,
                DATE(p.fecha_hora_inicio)                         AS fecha,
                DATE_FORMAT(p.fecha_hora_inicio, '%H:%i')         AS hora,
                COALESCE(el.nombre,'') AS local_nombre,
                COALESCE(ev.nombre,'') AS visit_nombre
            ");

        if ($partidoId) {
            $q->where('rp.partido_id', (int)$partidoId);
        }
        if ($desde && $hasta) {
            $q->whereBetween(DB::raw('DATE(p.fecha_hora_inicio)'), [$desde, $hasta]);
        }

        $q->orderBy('equipo')->orderBy('dorsal');

        if (!$all) {
            $q->offset($offset)->limit($pageSize);
        }

        $rows = $q->get();

        // Meta para encabezado
        $alcance = $all ? 'Todo completo' : "Página {$page} (máx. {$pageSize} filas)";
        $rango   = ($desde && $hasta) ? "Del {$desde} al {$hasta}" : 'Sin filtro de fechas';

        // Si se filtró por un partido, construimos “Local vs Visit (fecha hora)”
        $partidoInfo = 'Todos';
        if ($partidoId) {
            $one = DB::connection('mysql')->table('dim_partido as p')
                ->leftJoin('dim_equipo as el', 'el.equipo_id', '=', 'p.equipo_local_id')
                ->leftJoin('dim_equipo as ev', 'ev.equipo_id', '=', 'p.equipo_visitante_id')
                ->selectRaw("
                    p.partido_id,
                    COALESCE(el.nombre,'') AS local_nombre,
                    COALESCE(ev.nombre,'') AS visit_nombre,
                    DATE(p.fecha_hora_inicio)                 AS fecha,
                    DATE_FORMAT(p.fecha_hora_inicio, '%H:%i') AS hora
                ")
                ->where('p.partido_id', (int)$partidoId)
                ->first();

            if ($one) {
                $partidoInfo = "{$one->local_nombre} vs {$one->visit_nombre} ({$one->fecha} {$one->hora})";
            }
        }

        $meta = [
            'titulo'      => 'Reporte de Roster por Partido',
            'partido'     => $partidoInfo,
            'rango'       => $rango,
            'alcance'     => $alcance,
            'generado'    => now()->format('d/m/Y G:i'),
        ];

        $html = view('pdf.roster', compact('rows','meta'))->render();

        $pdf = app('dompdf.wrapper');
        $pdf->loadHTML($html)->setPaper('letter', 'portrait');

        return $pdf->download('roster.pdf');
        // o: return $pdf->stream('roster.pdf');
    }
}

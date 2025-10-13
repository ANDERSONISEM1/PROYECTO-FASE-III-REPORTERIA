<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Services\PartidosSyncService;

class PartidosController extends Controller
{
    public function __construct(private PartidosSyncService $sync) {}

    private function paginate(Request $req): array
    {
        $page     = max(1, (int) $req->query('page', 1));
        $pageSize = max(1, min(100, (int) $req->query('pageSize', 10)));
        $offset   = ($page - 1) * $pageSize;
        return [$page, $pageSize, $offset];
    }

    /** GET /api/report/partidos */
    public function index(Request $req)
    {
        // 🔥 Tiempo real: diffs + deletes en cada GET
        $this->sync->syncPartidosDiffAndDelete();

        [$page, $pageSize, $offset] = $this->paginate($req);

        $q = DB::connection('mysql')->table('vw_report_partidos');

        $desde = $req->query('desde');
        $hasta = $req->query('hasta');
        if ($desde && $hasta) {
            $q->whereBetween('fecha', [$desde, $hasta]);
        }

        $total = (int) $q->count();

        $rows = $q->orderBy('fecha')
            ->orderBy('hora')
            ->offset($offset)
            ->limit($pageSize)
            ->get();

        $columns = [
            ['key' => 'equipo_local',     'title' => 'equipo_local'],
            ['key' => 'equipo_visitante', 'title' => 'equipo_visitante'],
            ['key' => 'fecha',            'title' => 'fecha'],
            ['key' => 'hora',             'title' => 'hora'],
            ['key' => 'marcador_final',   'title' => 'marcador_final'],
        ];

        return response()->json(compact('columns','rows','total','page','pageSize'));
    }

    /** ✅ NUEVO: GET /api/report/lookup/partidos - Para el dropdown */
    public function lookupPartidos()
    {
        try {
            // Sincronización en tiempo real
            $this->sync->syncPartidosDiffAndDelete();

            // Primero verifica si existe la vista vw_partidos_combo
            $viewExists = DB::connection('mysql')
                ->select("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.VIEWS 
                         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vw_partidos_combo'");

            if (!empty($viewExists)) {
                // Usar la vista especial para dropdown
                $partidos = DB::connection('mysql')
                    ->table('vw_partidos_combo')
                    ->select('id', 'display_text', 'local', 'visitante', 'fecha')
                    ->orderBy('fecha', 'desc')
                    ->get();
            } else {
                // Fallback: usar la vista principal de partidos
                $partidos = DB::connection('mysql')
                    ->table('vw_report_partidos')
                    ->select(
                        DB::raw("CONCAT(equipo_local, ' vs ', equipo_visitante, ' (', fecha, ')') AS display_text"),
                        DB::raw("CONCAT(equipo_local, ' vs ', equipo_visitante) AS texto"),
                        'fecha'
                    )
                    ->orderBy('fecha', 'desc')
                    ->get()
                    ->map(function($item) {
                        return [
                            'id' => $item->texto, // Usar el texto como ID temporal
                            'display_text' => $item->display_text,
                            'local' => $item->texto,
                            'visitante' => '',
                            'fecha' => $item->fecha
                        ];
                    });
            }

            return response()->json($partidos);

        } catch (\Exception $e) {
            \Log::error('Error en lookupPartidos: ' . $e->getMessage());
            return response()->json([], 500);
        }
    }

    /** GET /api/report/partidos/pdf */
    public function pdf(Request $req)
    {
        // Mantener "tiempo real"
        $this->sync->syncPartidosDiffAndDelete();

        // Parámetros
        $all = (int) $req->query('all', 0) === 1; // all=1 => sin paginar
        [$page, $pageSize, $offset] = $this->paginate($req);

        $desde = $req->query('desde');
        $hasta = $req->query('hasta');

        // Base igual que index() sobre la VISTA
        $q = DB::connection('mysql')->table('vw_report_partidos');
        if ($desde && $hasta) {
            $q->whereBetween('fecha', [$desde, $hasta]);
        }
        $q->orderBy('fecha')->orderBy('hora');

        if (!$all) {
            $q->offset($offset)->limit($pageSize);
        }

        $rows = $q->get();

        // Meta
        $meta = [
            'titulo'   => 'Reporte de Partidos',
            'rango'    => ($desde && $hasta) ? "Del {$desde} al {$hasta}" : 'Sin filtro de fechas',
            'alcance'  => $all ? 'Todo completo' : "Página {$page} (máx. {$pageSize} filas)",
            'generado' => now()->format('d/m/Y G:i'),
        ];

        // Render blade → Dompdf
        $html = view('pdf.partidos', compact('rows','meta'))->render();

        $pdf = app('dompdf.wrapper');
        $pdf->loadHTML($html)->setPaper('letter', 'portrait');

        return $pdf->download('partidos.pdf');
        // o: return $pdf->stream('partidos.pdf');
    }
}






















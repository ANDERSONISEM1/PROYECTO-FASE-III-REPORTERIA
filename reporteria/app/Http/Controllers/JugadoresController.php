<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Services\JugadoresSyncService;

class JugadoresController extends Controller
{
    public function __construct(private JugadoresSyncService $sync) {}

    private function paginate(Request $req): array
    {
        $page     = max(1, (int) $req->query('page', 1));
        $pageSize = max(1, min(100, (int) $req->query('pageSize', 10)));
        $offset   = ($page - 1) * $pageSize;
        return [$page, $pageSize, $offset];
    }

    /** GET /api/report/jugadores */
    public function index(Request $req)
    {
        // Tiempo real (diff + delete barato)
        $this->sync->syncJugadoresDiffAndDelete();

        [$page, $pageSize, $offset] = $this->paginate($req);

        $q = DB::connection('mysql')->table('vw_report_jugadores');

        // -------- FILTROS --------
        // 1) Por equipo
        if ($req->filled('equipo_id')) {
            // La vista no trae equipo por defeault, así que filtramos sobre la base (dim_jugador)
            // y luego proyectamos a las columnas de la vista.
            $base = DB::connection('mysql')->table('dim_jugador')
                ->select(
                    'nombres','apellidos','dorsal','posicion','estatura_cm','edad','nacionalidad','activo'
                )
                ->where('equipo_id', (int) $req->query('equipo_id'));

            // 2) Fechas (solo si la columna existe en dim_jugador)
            $desde = $req->query('desde');
            $hasta = $req->query('hasta');
            $hasDateCol = $this->hasColumn('mysql', 'dim_jugador', 'fecha_creacion');

            if ($hasDateCol && $desde && $hasta) {
                $base->whereBetween(DB::raw('DATE(fecha_creacion)'), [$desde, $hasta]);
            }

            // Conteo y pagina sobre la subconsulta
            $total = (int) DB::connection('mysql')->table(DB::raw("({$base->toSql()}) as t"))
                ->mergeBindings($base)
                ->count();

            $rows = $base->orderBy('apellidos')
                ->offset($offset)
                ->limit($pageSize)
                ->get();

            $columns = [
                ['key' => 'nombres',      'title' => 'nombres'],
                ['key' => 'apellidos',    'title' => 'apellidos'],
                ['key' => 'dorsal',       'title' => 'dorsal'],
                ['key' => 'posicion',     'title' => 'posicion'],
                ['key' => 'estatura_cm',  'title' => 'estatura_cm'],
                ['key' => 'edad',         'title' => 'edad'],
                ['key' => 'nacionalidad', 'title' => 'nacionalidad'],
                ['key' => 'activo',       'title' => 'activo'],
            ];

            return response()->json(compact('columns','rows','total','page','pageSize'));
        }

        // 2) Si no hay equipo_id, usamos la vista directamente.
        $desde = $req->query('desde');
        $hasta = $req->query('hasta');
        $hasDateCol = $this->hasColumn('mysql', 'dim_jugador', 'fecha_creacion');

        if ($hasDateCol && $desde && $hasta) {
            // Filtramos por fecha sobre base y proyectamos como vista
            $base = DB::connection('mysql')->table('dim_jugador')
                ->select(
                    'nombres','apellidos','dorsal','posicion','estatura_cm','edad','nacionalidad','activo'
                )
                ->whereBetween(DB::raw('DATE(fecha_creacion)'), [$desde, $hasta]);

            $total = (int) DB::connection('mysql')->table(DB::raw("({$base->toSql()}) as t"))
                ->mergeBindings($base)
                ->count();

            $rows = $base->orderBy('apellidos')
                ->offset($offset)
                ->limit($pageSize)
                ->get();
        } else {
            // Sin filtro fecha
            $total = (int) $q->count();
            $rows = $q->orderBy('apellidos')
                ->offset($offset)
                ->limit($pageSize)
                ->get();
        }

        $columns = [
            ['key' => 'nombres',      'title' => 'nombres'],
            ['key' => 'apellidos',    'title' => 'apellidos'],
            ['key' => 'dorsal',       'title' => 'dorsal'],
            ['key' => 'posicion',     'title' => 'posicion'],
            ['key' => 'estatura_cm',  'title' => 'estatura_cm'],
            ['key' => 'edad',         'title' => 'edad'],
            ['key' => 'nacionalidad', 'title' => 'nacionalidad'],
            ['key' => 'activo',       'title' => 'activo'],
        ];

        return response()->json(compact('columns','rows','total','page','pageSize'));
    }

/** GET /api/report/jugadores/pdf */
public function pdf(Request $req)
{
    // Mantén sincronización en tiempo real
    $this->sync->syncJugadoresDiffAndDelete();

    // Mismos filtros que el index()
    $equipoId   = $req->query('equipo_id');
    $desde      = $req->query('desde');
    $hasta      = $req->query('hasta');
    $hasDateCol = $this->hasColumn('mysql', 'dim_jugador', 'fecha_creacion');

    // Nuevo: controlar si es “todo” o solo la página actual
    $all      = (int) $req->query('all', 0) === 1;  // all=1 => sin paginar
    $page     = max(1, (int) $req->query('page', 1));
    $pageSize = max(1, min(100, (int) $req->query('pageSize', 10)));
    $offset   = ($page - 1) * $pageSize;

    // Base: trabajamos sobre dim_jugador y proyectamos a columnas de la vista
    $q = DB::connection('mysql')->table('dim_jugador')
        ->select('nombres','apellidos','dorsal','posicion','estatura_cm','edad','nacionalidad','activo');

    if ($equipoId) {
        $q->where('equipo_id', (int) $equipoId);
    }
    if ($hasDateCol && $desde && $hasta) {
        $q->whereBetween(DB::raw('DATE(fecha_creacion)'), [$desde, $hasta]);
    }

    // Orden igual que en index()
    $q->orderBy('apellidos');

    // Si no es “todo”, paginar igual que la vista previa
    if (!$all) {
        $q->offset($offset)->limit($pageSize);
    }

    $rows = $q->get();

    // Meta bonita para el encabezado del PDF
    $equipoNombre = $equipoId
        ? (DB::connection('mysql')->table('dim_equipo')->where('equipo_id', (int)$equipoId)->value('nombre') ?? '—')
        : 'Todos';

    $rango = ($hasDateCol && $desde && $hasta)
        ? "Del {$desde} al {$hasta}"
        : 'Sin filtro de fechas';

    $alcance = $all
        ? 'Todo completo'
        : "Página {$page} (máx. {$pageSize} filas)";

    $meta = [
        'titulo'    => 'Reporte de Jugadores',
        'rango'     => $rango,
        'equipo'    => $equipoNombre,
        'alcance'   => $alcance,
       'generado'  => now()->format('d/m/Y G:i'), // Ej: 15/03/2025 14:30
    ];

    $pdfHtml = view('pdf.jugadores', compact('rows','meta'))->render();

    $pdf = app('dompdf.wrapper');
    $pdf->loadHTML($pdfHtml)->setPaper('letter', 'portrait');

    return $pdf->download('jugadores.pdf');
    // o: return $pdf->stream('jugadores.pdf');
}


    /** Utilidad: verifica si una columna existe (para no romper si no tienes fecha en dim_jugador). */
    private function hasColumn(string $connection, string $table, string $column): bool
    {
        try {
            $cols = DB::connection($connection)->select("SHOW COLUMNS FROM {$table}");
            foreach ($cols as $c) {
                if (isset($c->Field) && $c->Field === $column) return true;
                if (isset($c->COLUMN_NAME) && $c->COLUMN_NAME === $column) return true;
            }
        } catch (\Throwable $e) {
            // ignora
        }
        return false;
    }
}

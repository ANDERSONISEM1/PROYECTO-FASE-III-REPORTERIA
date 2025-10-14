<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Services\EquipoSyncService;

class EquipoController extends Controller
{
    public function __construct(private EquipoSyncService $sync) {}

    private function paginate(Request $req): array
    {
        $page     = max(1, (int) $req->query('page', 1));
        $pageSize = max(1, min(100, (int) $req->query('pageSize', 10)));
        $offset   = ($page - 1) * $pageSize;
        return [$page, $pageSize, $offset];
    }

    /** GET /api/report/equipos  (vista previa) */
    public function equipos(Request $req)
    {
        // Tiempo real: diffs + deletes (barato si no hay cambios)
        $this->sync->syncEquiposDiffAndDelete();

        [$page, $pageSize, $offset] = $this->paginate($req);

        $desde = $req->query('desde');
        $hasta = $req->query('hasta');

        // La vista trae: nombre, ciudad, abreviatura, logo, activo, fecha_creacion
        // Para filtrar por fecha, usamos la base (dim_equipo) y proyectamos como la vista.
        $hasDateCol = $this->hasColumn('mysql', 'dim_equipo', 'fecha_creacion');

        if ($hasDateCol && $desde && $hasta) {
            $base = DB::connection('mysql')->table('dim_equipo')
                ->select(
                    'nombre',
                    'ciudad',
                    'abreviatura',
                    DB::raw('logo_path AS logo'),
                    'activo',
                    'fecha_creacion'
                )
                ->whereBetween(DB::raw('DATE(fecha_creacion)'), [$desde, $hasta]);

            $total = (int) DB::connection('mysql')
                ->table(DB::raw("({$base->toSql()}) AS t"))
                ->mergeBindings($base)
                ->count();

            $rows = $base->orderBy('fecha_creacion', 'asc')
                ->offset($offset)
                ->limit($pageSize)
                ->get();
        } else {
            // Sin filtro de fecha, leemos la vista directa
            $q = DB::connection('mysql')->table('vw_report_equipos');
            $total = (int) $q->count();
            $rows = $q->orderBy('fecha_creacion', 'asc')
                ->offset($offset)
                ->limit($pageSize)
                ->get();
        }

        $columns = [
            ['key' => 'nombre',         'title' => 'nombre'],
            ['key' => 'ciudad',         'title' => 'ciudad'],
            ['key' => 'abreviatura',    'title' => 'abreviatura'],
            ['key' => 'logo',           'title' => 'logo'],
            ['key' => 'activo',         'title' => 'activo'],
            ['key' => 'fecha_creacion', 'title' => 'fecha_creacion'],
        ];

        return response()->json(compact('columns','rows','total','page','pageSize'));
    }

    /** GET /api/report/lookup/equipos (también en “tiempo real”) */
    public function lookupEquipos()
    {
        $this->sync->syncEquiposDiffAndDelete();

        $rows = DB::connection('mysql')->table('dim_equipo')
            ->selectRaw('CAST(equipo_id AS CHAR) AS id, nombre')
            ->orderBy('nombre')
            ->get();

        return response()->json($rows);
    }

    /** GET /api/report/equipos/pdf */
    public function pdf(Request $req)
    {
        // Mantén sincronización en tiempo real
        $this->sync->syncEquiposDiffAndDelete();

        $desde = $req->query('desde');
        $hasta = $req->query('hasta');
        $all   = (int) $req->query('all', 0) === 1; // all=1 => sin paginar
        $page     = max(1, (int) $req->query('page', 1));
        $pageSize = max(1, min(100, (int) $req->query('pageSize', 10)));
        $offset   = ($page - 1) * $pageSize;

        $hasDateCol = $this->hasColumn('mysql', 'dim_equipo', 'fecha_creacion');

        // Base para PDF (proyectar como la vista)
        $q = DB::connection('mysql')->table('dim_equipo')
            ->select(
                'nombre',
                'ciudad',
                'abreviatura',
                DB::raw('logo_path AS logo'),
                'activo',
                'fecha_creacion'
            );

        if ($hasDateCol && $desde && $hasta) {
            $q->whereBetween(DB::raw('DATE(fecha_creacion)'), [$desde, $hasta]);
        }

        $q->orderBy('fecha_creacion', 'asc');

        if (!$all) {
            $q->offset($offset)->limit($pageSize);
        }

        $rows = $q->get();

        $rango = ($hasDateCol && $desde && $hasta)
            ? "Del {$desde} al {$hasta}"
            : 'Sin filtro de fechas';

        $alcance = $all
            ? 'Todo completo'
            : "Página {$page} (máx. {$pageSize} filas)";

        $meta = [
            'titulo'   => 'Reporte de Equipos',
            'rango'    => $rango,
            'alcance'  => $alcance,
            'generado' => now()->format('d/m/Y G:i'),
        ];

        $html = view('pdf.equipo', compact('rows','meta'))->render();

        $pdf = app('dompdf.wrapper');
        $pdf->loadHTML($html)->setPaper('letter', 'portrait');

        return $pdf->download('equipos.pdf');
        // o: return $pdf->stream('equipos.pdf');
    }

    /** Utilidad: evita errores si aún no tienes la columna */
    private function hasColumn(string $connection, string $table, string $column): bool
    {
        try {
            $cols = DB::connection($connection)->select("SHOW COLUMNS FROM {$table}");
            foreach ($cols as $c) {
                if ((isset($c->Field) && $c->Field === $column) ||
                    (isset($c->COLUMN_NAME) && $c->COLUMN_NAME === $column)) {
                    return true;
                }
            }
        } catch (\Throwable $e) {
            // ignora
        }
        return false;
    }
}

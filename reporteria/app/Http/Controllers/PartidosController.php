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

    /**
     * GET /api/report/partidos
     * Columnas exactas: equipo_local, equipo_visitante, fecha, hora, marcador_final
     * Filtros opcionales: ?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
     */
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

        $rows = $q->orderBy('fecha')->orderBy('hora')
            ->offset($offset)->limit($pageSize)->get();

        $columns = [
            ['key' => 'equipo_local',     'title' => 'equipo_local'],
            ['key' => 'equipo_visitante', 'title' => 'equipo_visitante'],
            ['key' => 'fecha',            'title' => 'fecha'],
            ['key' => 'hora',             'title' => 'hora'],
            ['key' => 'marcador_final',   'title' => 'marcador_final'],
        ];

        return response()->json(compact('columns','rows','total','page','pageSize'));
    }
}

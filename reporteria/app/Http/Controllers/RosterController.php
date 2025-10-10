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
     * Columnas: equipo, jugador, dorsal, posicion
     * Filtros:
     *   - ?partidoId=123  (convocados de ese partido)
     */
    public function index(Request $req)
    {
        // 🔥 tiempo real: diffs + deletes en cada GET (barato si no cambió)
        $this->sync->syncRosterDiffAndDelete();

        [$page, $pageSize, $offset] = $this->paginate($req);

        $q = DB::connection('mysql')->table('vw_report_roster');

        if ($req->filled('partidoId')) {
            $partidoId = (int) $req->query('partidoId');
            // Acotamos por partido usando exists contra el bridge
            $q->whereExists(function($sub) use ($partidoId) {
                $sub->from('bridge_roster_partido as rp')
                    ->join('dim_jugador as j2', 'j2.jugador_id', '=', 'rp.jugador_id')
                    ->join('dim_equipo  as e2', 'e2.equipo_id',  '=', 'rp.equipo_id')
                    ->where('rp.partido_id', $partidoId)
                    ->whereRaw("CONCAT(j2.nombres,' ',j2.apellidos)=vw_report_roster.jugador")
                    ->whereColumn('e2.nombre', 'vw_report_roster.equipo')
                    ->selectRaw('1');
            });
        }

        $total = (int) $q->count();

        $rows = $q->orderBy('equipo')
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
}

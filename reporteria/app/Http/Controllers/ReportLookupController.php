<?php
//esta clase esta ligada a los roster para que muestre en el filtrar por partido
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Lookups para los selects de reportería.
 * - Partidos: usa vw_partidos_combo (debe incluir partido_id, equipo_local, equipo_visitante, fecha)
 * - Equipos : usa vw_equipos_combo (equipo_id, nombre)
 */
class ReportLookupController extends Controller
{
    /** GET /api/report/lookup/partidos */
    public function partidos(Request $req)
    {
        $rows = DB::connection('mysql')
            ->table('vw_partidos_combo')
            ->selectRaw("
                partido_id           AS id,
                equipo_local         AS local,
                equipo_visitante     AS visit,
                DATE_FORMAT(fecha, '%Y-%m-%d') AS fecha
            ")
            ->orderBy('fecha', 'desc')
            ->get();

        return response()->json($rows);
    }

    /** GET /api/report/lookup/equipos */
    public function equipos(Request $req)
    {
        $rows = DB::connection('mysql')
            ->table('vw_equipos_combo')
            ->selectRaw("equipo_id AS id, nombre")
            ->orderBy('nombre')
            ->get();

        return response()->json($rows);
    }
}

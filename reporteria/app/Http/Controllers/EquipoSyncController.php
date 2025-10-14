<?php

namespace App\Http\Controllers;

use App\Services\EquipoSyncService;
use Illuminate\Support\Facades\Log;

class EquipoSyncController extends Controller
{
    public function equipos(EquipoSyncService $svc)
    {
        try {
            // Modo inteligente por defecto: diffs + deletes
            $res = $svc->syncEquiposDiffAndDelete();
            return response()->json(['ok' => true, 'summary' => $res]);
        } catch (\Throwable $e) {
            Log::error('SYNC equipos ERROR', [
                'msg'  => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);
            return response()->json([
                'ok'    => false,
                'error' => $e->getMessage(),
                'at'    => $e->getFile() . ':' . $e->getLine(),
            ], 500);
        }
    }
}

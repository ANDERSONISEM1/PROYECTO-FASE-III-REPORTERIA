<?php

namespace App\Http\Controllers;

use App\Services\JugadoresSyncService;
use Illuminate\Support\Facades\Log;

class JugadoresSyncController extends Controller
{
    public function sync(JugadoresSyncService $svc)
    {
        try {
            // Modo inteligente por defecto: diffs + deletes
            $res = $svc->syncJugadoresDiffAndDelete();
            return response()->json(['ok' => true, 'summary' => $res]);
        } catch (\Throwable $e) {
            Log::error('SYNC jugadores ERROR', [
                'msg'  => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);
            return response()->json([
                'ok'    => false,
                'error' => $e->getMessage(),
                'at'    => $e->getFile().':'.$e->getLine(),
            ], 500);
        }
    }
}

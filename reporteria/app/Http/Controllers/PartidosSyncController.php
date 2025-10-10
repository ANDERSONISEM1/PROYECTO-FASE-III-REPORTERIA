<?php

namespace App\Http\Controllers;

use App\Services\PartidosSyncService;
use Illuminate\Support\Facades\Log;

class PartidosSyncController extends Controller
{
    public function sync(PartidosSyncService $svc)
    {
        try {
            $res = $svc->syncPartidosDiffAndDelete();
            return response()->json(['ok' => true, 'summary' => $res]);
        } catch (\Throwable $e) {
            Log::error('SYNC partidos ERROR', [
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

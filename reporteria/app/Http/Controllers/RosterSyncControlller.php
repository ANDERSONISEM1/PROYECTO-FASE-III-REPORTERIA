<?php

namespace App\Http\Controllers;

use App\Services\RosterSyncService;
use Illuminate\Support\Facades\Log;

class RosterSyncController extends Controller
{
    public function sync(RosterSyncService $svc)
    {
        try {
            $res = $svc->syncRosterDiffAndDelete();
            return response()->json(['ok' => true, 'summary' => $res]);
        } catch (\Throwable $e) {
            Log::error('SYNC roster ERROR', [
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

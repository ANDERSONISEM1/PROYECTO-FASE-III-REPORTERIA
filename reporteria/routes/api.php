<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;

use App\Http\Controllers\EquipoSyncController;
use App\Http\Controllers\EquipoController;
use App\Http\Controllers\JugadoresSyncController;
use App\Http\Controllers\JugadoresController;
use App\Http\Controllers\PartidosSyncController;
use App\Http\Controllers\PartidosController;
use App\Http\Controllers\RosterSyncController;
use App\Http\Controllers\RosterController;
use App\Http\Controllers\ReportLookupController;

/** Healthcheck */
Route::get('/ping', fn () => response()->json(['ok' => true, 'pong' => now()->toDateTimeString()]));

/** Sync manual */
Route::post('/admin/sync/equipos', [EquipoSyncController::class, 'equipos']);
Route::post('/admin/sync/jugadores', [JugadoresSyncController::class, 'sync']);
Route::post('/admin/sync/partidos', [PartidosSyncController::class, 'sync']);
Route::post('/admin/sync/roster', [RosterSyncController::class, 'sync']);

/** Reportería PRINCIPAL */
Route::get('/report/equipos',   [EquipoController::class, 'equipos']);
Route::get('/report/jugadores', [JugadoresController::class, 'index']);
Route::get('/report/partidos',  [PartidosController::class, 'index']);
Route::get('/report/roster',    [RosterController::class, 'index']);

/** PDFs */
Route::get('/report/equipos/pdf',   [EquipoController::class, 'pdf']);
Route::get('/report/jugadores/pdf', [JugadoresController::class, 'pdf']);
Route::get('/report/partidos/pdf',  [PartidosController::class, 'pdf']);
Route::get('/report/roster/pdf',    [RosterController::class, 'pdf']);

/** Lookups (combos para dropdowns Angular) */
Route::get('/report/lookup/equipos',  [ReportLookupController::class, 'equipos']);
Route::get('/report/lookup/partidos', [ReportLookupController::class, 'partidos']);

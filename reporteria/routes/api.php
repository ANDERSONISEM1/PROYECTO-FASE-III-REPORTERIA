<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\EquipoSyncController;
use App\Http\Controllers\EquipoController;

use App\Http\Controllers\JugadoresSyncController;
use App\Http\Controllers\JugadoresController;

use App\Http\Controllers\PartidosSyncController;
use App\Http\Controllers\PartidosController;

use App\Http\Controllers\RosterSyncController;
use App\Http\Controllers\RosterController;

/** Healthcheck */
Route::get('/ping', fn () => response()->json(['ok' => true, 'pong' => now()->toDateTimeString()]));

/** Sync manual (opcional) */
Route::post('/admin/sync/equipos', [EquipoSyncController::class, 'equipos']);

/** Reportería (cada GET sincroniza si hace falta) */
Route::get('/report/equipos',   [EquipoController::class, 'equipos']);
Route::get('/report/jugadores', [EquipoController::class, 'jugadores']);
Route::get('/report/partidos',  [EquipoController::class, 'partidos']);
Route::get('/report/roster',    [EquipoController::class, 'roster']);



/** Lookups */
Route::get('/report/lookup/equipos',  [EquipoController::class, 'lookupEquipos']);
Route::get('/report/lookup/partidos', [EquipoController::class, 'lookupPartidos']);
Route::get('/report/equipos/pdf',  [EquipoController::class, 'pdf']); // 👈 nuevo


Route::post('/admin/sync/jugadores', [JugadoresSyncController::class, 'sync']);
Route::get('/report/jugadores',      [JugadoresController::class, 'index']);
Route::get('/report/jugadores/pdf',  [JugadoresController::class, 'pdf']); // NUEVA


Route::post('/admin/sync/partidos', [PartidosSyncController::class, 'sync']);
Route::get('/report/partidos',      [PartidosController::class, 'index']);
Route::get('/report/partidos/pdf', [PartidosController::class, 'pdf']); 


Route::post('/admin/sync/roster', [RosterSyncController::class, 'sync']);
Route::get('/report/roster',      [RosterController::class, 'index']);
Route::get('/report/roster/pdf',[RosterController::class, 'pdf']);   // 👈 PDF Roster
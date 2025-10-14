<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class JugadoresSyncService
{
    protected $sqlsrv;
    protected $mysql;

    public function __construct()
    {
        $this->sqlsrv = DB::connection('sqlsrv_main'); // SQL Server (origen)
        $this->mysql  = DB::connection('mysql');       // MySQL (Data Mart)
    }

    /** Hash estable de campos de negocio (detecta edits). */
    private function fingerprint(array $row): string
    {
        $norm = [
            'jugador_id'   => (int)($row['jugador_id'] ?? 0),
            'equipo_id'    => (int)($row['equipo_id'] ?? 0),
            'nombres'      => (string)($row['nombres'] ?? ''),
            'apellidos'    => (string)($row['apellidos'] ?? ''),
            'dorsal'       => is_null($row['dorsal'] ?? null) ? null : (int)$row['dorsal'],
            'posicion'     => $row['posicion'] ?? null,
            'estatura_cm'  => is_null($row['estatura_cm'] ?? null) ? null : (int)$row['estatura_cm'],
            'edad'         => is_null($row['edad'] ?? null) ? null : (int)$row['edad'],
            'nacionalidad' => $row['nacionalidad'] ?? null,
            'activo'       => (int)($row['activo'] ?? 0),
        ];
        return sha1(json_encode($norm, JSON_UNESCAPED_UNICODE));
    }

    /** SQL Server → filas normalizadas + set de IDs. */
    private function readSource(): array
    {
        $srcRows = $this->sqlsrv->table('dbo.Jugador')->select(
            'jugador_id','equipo_id','nombres','apellidos',
            'dorsal','posicion','estatura_cm','edad','nacionalidad','activo'
        )->orderBy('jugador_id')->get();

        $payload = [];
        $idSet = [];
        foreach ($srcRows as $r) {
            $row = [
                'jugador_id'   => (int) $r->jugador_id,
                'equipo_id'    => (int) $r->equipo_id,
                'nombres'      => (string) $r->nombres,
                'apellidos'    => (string) $r->apellidos,
                'dorsal'       => is_null($r->dorsal) ? null : (int) $r->dorsal,
                'posicion'     => $r->posicion ?: null,
                'estatura_cm'  => is_null($r->estatura_cm) ? null : (int) $r->estatura_cm,
                'edad'         => is_null($r->edad) ? null : (int) $r->edad,
                'nacionalidad' => $r->nacionalidad ?: null,
                'activo'       => (int) $r->activo,
            ];
            $row['_hash'] = $this->fingerprint($row);
            $payload[] = $row;
            $idSet[$row['jugador_id']] = true;
        }

        return [$payload, array_keys($idSet)];
    }

    /** MySQL → mapa jugador_id → hash + set de IDs existentes. */
    private function currentDest(): array
    {
        $rows = $this->mysql->table('dim_jugador')->select(
            'jugador_id','equipo_id','nombres','apellidos',
            'dorsal','posicion','estatura_cm','edad','nacionalidad','activo'
        )->get();

        $hashMap = [];
        $ids = [];
        foreach ($rows as $r) {
            $row = [
                'jugador_id'   => (int) $r->jugador_id,
                'equipo_id'    => (int) $r->equipo_id,
                'nombres'      => (string) $r->nombres,
                'apellidos'    => (string) $r->apellidos,
                'dorsal'       => is_null($r->dorsal) ? null : (int) $r->dorsal,
                'posicion'     => $r->posicion ?: null,
                'estatura_cm'  => is_null($r->estatura_cm) ? null : (int) $r->estatura_cm,
                'edad'         => is_null($r->edad) ? null : (int) $r->edad,
                'nacionalidad' => $r->nacionalidad ?: null,
                'activo'       => (int) $r->activo,
            ];
            $ids[] = (int)$r->jugador_id;
            $hashMap[(int)$r->jugador_id] = $this->fingerprint($row);
        }
        return [$hashMap, $ids];
    }

    /**
     * 🔥 Diffs (inserts/edits) + Deletes (mirror inmediato).
     * - Upsert SOLO lo cambiado/nuevo (por hash)
     * - Delete TODOS los que ya no existen en origen
     *   *Si hay FK y falla el delete → soft-delete (activo=0)*
     */
    public function syncJugadoresDiffAndDelete(): array
    {
        [$src, $srcIds] = $this->readSource();
        [$dstHash, $dstIds] = $this->currentDest();

        // 1) Detectar inserts/edits por hash
        $toUpsert = [];
        foreach ($src as $row) {
            $id = $row['jugador_id'];
            $hash = $row['_hash'];
            if (!isset($dstHash[$id]) || $dstHash[$id] !== $hash) {
                $toUpsert[] = [
                    'jugador_id'   => $row['jugador_id'],
                    'equipo_id'    => $row['equipo_id'],
                    'nombres'      => $row['nombres'],
                    'apellidos'    => $row['apellidos'],
                    'dorsal'       => $row['dorsal'],
                    'posicion'     => $row['posicion'],
                    'estatura_cm'  => $row['estatura_cm'],
                    'edad'         => $row['edad'],
                    'nacionalidad' => $row['nacionalidad'],
                    'activo'       => $row['activo'],
                ];
            }
        }

        // 2) Detectar deletes por diferencia de conjuntos
        $srcSet = array_fill_keys($srcIds, true);
        $toDelete = [];
        foreach ($dstIds as $id) {
            if (!isset($srcSet[$id])) {
                $toDelete[] = (int)$id;
            }
        }

        $upserts = 0; $deleted = 0; $softDeleted = 0;

        // 3) Ejecutar cambios en una sola transacción
        $this->mysql->transaction(function () use (&$upserts, &$deleted, &$softDeleted, $toUpsert, $toDelete) {
            // upserts
            if (!empty($toUpsert)) {
                foreach (array_chunk($toUpsert, 1000) as $chunk) {
                    $upserts += $this->mysql->table('dim_jugador')->upsert(
                        $chunk,
                        ['jugador_id'],
                        [
                            'equipo_id','nombres','apellidos','dorsal','posicion',
                            'estatura_cm','edad','nacionalidad','activo'
                        ]
                    );
                }
            }

            // deletes
            if (!empty($toDelete)) {
                foreach (array_chunk($toDelete, 1000) as $chunkIds) {
                    try {
                        $deleted += $this->mysql->table('dim_jugador')->whereIn('jugador_id', $chunkIds)->delete();
                    } catch (\Throwable $e) {
                        // FKs u otra restricción: fallback a soft-delete
                        $softDeleted += $this->mysql->table('dim_jugador')
                            ->whereIn('jugador_id', $chunkIds)
                            ->update(['activo' => 0]);
                    }
                }
            }
        });

        return [
            'checked_src'  => count($src),
            'changed_upserts' => count($toUpsert),
            'applied_upserts' => $upserts,
            'hard_deleted'    => $deleted,
            'soft_deleted'    => $softDeleted,
            'total_mysql'     => (int)$this->mysql->table('dim_jugador')->count(),
            'mode'            => 'diff-hash + delete',
        ];
    }

    /**
     * Espejo completo (por si quieres forzar): upsert de TODO y prune de “extras”.
     */
    public function syncJugadoresUpsertMirror(): array
    {
        [$src, $srcIds] = $this->readSource();
        $payload = array_map(function ($r) { unset($r['_hash']); return $r; }, $src);

        $upserts = 0; $deleted = 0; $softDeleted = 0;

        $this->mysql->transaction(function () use (&$upserts, &$deleted, &$softDeleted, $payload, $srcIds) {
            // upsert todo
            foreach (array_chunk($payload, 1000) as $chunk) {
                $upserts += $this->mysql->table('dim_jugador')->upsert(
                    $chunk,
                    ['jugador_id'],
                    [
                        'equipo_id','nombres','apellidos','dorsal','posicion',
                        'estatura_cm','edad','nacionalidad','activo'
                    ]
                );
            }

            // prune: borrar lo que no esté en origen
            $dstIds = $this->mysql->table('dim_jugador')->pluck('jugador_id')->map(fn($v)=>(int)$v)->all();
            $srcSet = array_fill_keys($srcIds, true);
            $toDelete = [];
            foreach ($dstIds as $id) if (!isset($srcSet[$id])) $toDelete[] = $id;

            if (!empty($toDelete)) {
                foreach (array_chunk($toDelete, 1000) as $chunkIds) {
                    try {
                        $deleted += $this->mysql->table('dim_jugador')->whereIn('jugador_id', $chunkIds)->delete();
                    } catch (\Throwable $e) {
                        $softDeleted += $this->mysql->table('dim_jugador')
                            ->whereIn('jugador_id', $chunkIds)
                            ->update(['activo' => 0]);
                    }
                }
            }
        });

        return [
            'total_sqlsrv'   => count($payload),
            'applied_upserts'=> $upserts,
            'hard_deleted'   => $deleted,
            'soft_deleted'   => $softDeleted,
            'total_mysql'    => (int)$this->mysql->table('dim_jugador')->count(),
            'mode'           => 'upsert-full + prune',
        ];
    }
}







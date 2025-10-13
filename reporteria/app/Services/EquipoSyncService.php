<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class EquipoSyncService
{
    protected $sqlsrv;
    protected $mysql;

    public function __construct()
    {
        $this->sqlsrv = DB::connection('sqlsrv_main'); // origen
        $this->mysql  = DB::connection('mysql');       // destino
    }

    /** Hash estable de campos de negocio (detecta edits). */
    private function fingerprint(array $row): string
    {
        $norm = [
            'equipo_id'      => (int)($row['equipo_id'] ?? 0),
            'nombre'         => (string)($row['nombre'] ?? ''),
            'ciudad'         => $row['ciudad'] ?? null,
            'abreviatura'    => $row['abreviatura'] ?? null,
            'logo_path'      => $row['logo_path'] ?? null,
            'activo'         => (int)($row['activo'] ?? 0),
            'fecha_creacion' => (string)($row['fecha_creacion'] ?? '1970-01-01 00:00:00'),
        ];
        return sha1(json_encode($norm, JSON_UNESCAPED_UNICODE));
    }

    /** Lee SQL Server → payload normalizado + set de IDs. */
    private function readSource(): array
    {
        $srcRows = $this->sqlsrv->table('dbo.Equipo')
            ->select('equipo_id','nombre','ciudad','abreviatura','activo','fecha_creacion')
            ->orderBy('equipo_id')
            ->get();

        $payload = [];
        $idSet = [];
        foreach ($srcRows as $r) {
            $row = [
                'equipo_id'      => (int) $r->equipo_id,
                'nombre'         => (string) $r->nombre,
                'ciudad'         => $r->ciudad ?: null,
                'abreviatura'    => $r->abreviatura ?: null,
                'logo_path'      => null, // URL/logo lo pone el front si aplica
                'activo'         => (int) $r->activo,
                'fecha_creacion' => Carbon::parse($r->fecha_creacion)->format('Y-m-d H:i:s'),
            ];
            $row['_hash'] = $this->fingerprint($row);
            $payload[] = $row;
            $idSet[$row['equipo_id']] = true;
        }

        return [$payload, array_keys($idSet)];
    }

    /** MySQL → mapa equipo_id → hash + set de IDs. */
    private function currentDest(): array
    {
        $rows = $this->mysql->table('dim_equipo')->select(
            'equipo_id','nombre','ciudad','abreviatura','logo_path','activo','fecha_creacion'
        )->get();

        $hashMap = [];
        $ids = [];
        foreach ($rows as $r) {
            $row = [
                'equipo_id'      => (int) $r->equipo_id,
                'nombre'         => (string) $r->nombre,
                'ciudad'         => $r->ciudad ?: null,
                'abreviatura'    => $r->abreviatura ?: null,
                'logo_path'      => $r->logo_path ?: null,
                'activo'         => (int) $r->activo,
                'fecha_creacion' => Carbon::parse($r->fecha_creacion)->format('Y-m-d H:i:s'),
            ];
            $ids[] = (int)$r->equipo_id;
            $hashMap[(int)$r->equipo_id] = $this->fingerprint($row);
        }
        return [$hashMap, $ids];
    }

    /**
     * 🔥 Diffs (inserts/edits) + Deletes inmediatos (mirror).
     * Si un delete falla por FKs → fallback a soft-delete (activo=0).
     */
    public function syncEquiposDiffAndDelete(): array
    {
        [$src, $srcIds] = $this->readSource();
        [$dstHash, $dstIds] = $this->currentDest();

        // upserts por hash
        $toUpsert = [];
        foreach ($src as $row) {
            $id = $row['equipo_id'];
            if (!isset($dstHash[$id]) || $dstHash[$id] !== $row['_hash']) {
                $toUpsert[] = [
                    'equipo_id'      => $row['equipo_id'],
                    'nombre'         => $row['nombre'],
                    'ciudad'         => $row['ciudad'],
                    'abreviatura'    => $row['abreviatura'],
                    'logo_path'      => $row['logo_path'],
                    'activo'         => $row['activo'],
                    'fecha_creacion' => $row['fecha_creacion'],
                ];
            }
        }

        // deletes por diferencia de conjuntos
        $srcSet = array_fill_keys($srcIds, true);
        $toDelete = [];
        foreach ($dstIds as $id) if (!isset($srcSet[$id])) $toDelete[] = (int)$id;

        $upserts = 0; $deleted = 0; $softDeleted = 0;

        $this->mysql->transaction(function () use (&$upserts, &$deleted, &$softDeleted, $toUpsert, $toDelete) {
            if (!empty($toUpsert)) {
                foreach (array_chunk($toUpsert, 1000) as $chunk) {
                    $upserts += $this->mysql->table('dim_equipo')->upsert(
                        $chunk,
                        ['equipo_id'],
                        ['nombre','ciudad','abreviatura','logo_path','activo','fecha_creacion']
                    );
                }
            }

            if (!empty($toDelete)) {
                foreach (array_chunk($toDelete, 1000) as $ids) {
                    try {
                        $deleted += $this->mysql->table('dim_equipo')->whereIn('equipo_id', $ids)->delete();
                    } catch (\Throwable $e) {
                        // FKs: baja lógica
                        $softDeleted += $this->mysql->table('dim_equipo')
                            ->whereIn('equipo_id', $ids)
                            ->update(['activo' => 0]);
                    }
                }
            }
        });

        return [
            'changed_upserts' => count($toUpsert),
            'applied_upserts' => $upserts,
            'hard_deleted'    => $deleted,
            'soft_deleted'    => $softDeleted,
            'total_mysql'     => (int)$this->mysql->table('dim_equipo')->count(),
            'mode'            => 'diff-hash + delete',
        ];
    }

    /**
     * Espejo completo forzado: upsert TODO y eliminar lo que no esté en origen.
     */
    public function syncEquiposUpsertMirror(): array
    {
        [$src, $srcIds] = $this->readSource();
        $payload = array_map(function ($r) { unset($r['_hash']); return $r; }, $src);

        $upserts = 0; $deleted = 0; $softDeleted = 0;

        $this->mysql->transaction(function () use (&$upserts, &$deleted, &$softDeleted, $payload, $srcIds) {
            foreach (array_chunk($payload, 1000) as $chunk) {
                $upserts += $this->mysql->table('dim_equipo')->upsert(
                    $chunk,
                    ['equipo_id'],
                    ['nombre','ciudad','abreviatura','logo_path','activo','fecha_creacion']
                );
            }

            $dstIds = $this->mysql->table('dim_equipo')->pluck('equipo_id')->map(fn($v)=>(int)$v)->all();
            $srcSet = array_fill_keys($srcIds, true);
            $toDelete = [];
            foreach ($dstIds as $id) if (!isset($srcSet[$id])) $toDelete[] = $id;

            if (!empty($toDelete)) {
                foreach (array_chunk($toDelete, 1000) as $ids) {
                    try {
                        $deleted += $this->mysql->table('dim_equipo')->whereIn('equipo_id', $ids)->delete();
                    } catch (\Throwable $e) {
                        $softDeleted += $this->mysql->table('dim_equipo')
                            ->whereIn('equipo_id', $ids)
                            ->update(['activo' => 0]);
                    }
                }
            }
        });

        return [
            'applied_upserts'=> $upserts,
            'hard_deleted'   => $deleted,
            'soft_deleted'   => $softDeleted,
            'total_mysql'    => (int)$this->mysql->table('dim_equipo')->count(),
            'mode'           => 'upsert-full + prune',
        ];
    }
}

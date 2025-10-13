<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class RosterSyncService
{
    protected $sqlsrv;
    protected $mysql;

    public function __construct()
    {
        $this->sqlsrv = DB::connection('sqlsrv_main'); // origen
        $this->mysql  = DB::connection('mysql');       // destino
    }

    /** Hash estable por fila de roster (detecta cambios de edición). */
    private function fingerprint(array $r): string
    {
        $norm = [
            'roster_id'  => (int)($r['roster_id']  ?? 0),
            'partido_id' => (int)($r['partido_id'] ?? 0),
            'equipo_id'  => (int)($r['equipo_id']  ?? 0),
            'jugador_id' => (int)($r['jugador_id'] ?? 0),
            'es_titular' => (int)($r['es_titular'] ?? 0),
        ];
        return sha1(json_encode($norm, JSON_UNESCAPED_UNICODE));
    }

    /** Lee ORIGEN completo (dbo.RosterPartido) y calcula hashes por roster_id. */
    private function readSource(): array
    {
        $rows = $this->sqlsrv->table('dbo.RosterPartido')->select(
            'roster_id','partido_id','equipo_id','jugador_id','es_titular'
        )->orderBy('roster_id')->get();

        $payload = [];
        $srcIds  = [];
        $hashMap = [];
        foreach ($rows as $r) {
            $row = [
                'roster_id'  => (int) $r->roster_id,
                'partido_id' => (int) $r->partido_id,
                'equipo_id'  => (int) $r->equipo_id,
                'jugador_id' => (int) $r->jugador_id,
                'es_titular' => (int) $r->es_titular,
            ];
            $payload[] = $row;
            $srcIds[]  = $row['roster_id'];
            $hashMap[$row['roster_id']] = $this->fingerprint($row);
        }

        return [$payload, $srcIds, $hashMap];
    }

    /** Lee DESTINO actual (bridge_roster_partido) y hashes por roster_id. */
    private function currentDest(): array
    {
        $rows = $this->mysql->table('bridge_roster_partido')->get();
        $dstIds  = [];
        $hashMap = [];
        foreach ($rows as $r) {
            $row = [
                'roster_id'  => (int) $r->roster_id,
                'partido_id' => (int) $r->partido_id,
                'equipo_id'  => (int) $r->equipo_id,
                'jugador_id' => (int) $r->jugador_id,
                'es_titular' => (int) $r->es_titular,
            ];
            $dstIds[] = $row['roster_id'];
            $hashMap[$row['roster_id']] = $this->fingerprint($row);
        }
        return [$dstIds, $hashMap];
    }

    /**
     * 🔥 Diffs (inserts/edits) + Deletes inmediatos (mirror).
     * Rápido, idempotente y seguro en transacción.
     */
    public function syncRosterDiffAndDelete(): array
    {
        [$srcRows, $srcIds, $srcHash] = $this->readSource();
        [$dstIds,  $dstHash]          = $this->currentDest();

        // upserts (nuevos o editados)
        $toUpsert = [];
        foreach ($srcRows as $row) {
            $id = $row['roster_id'];
            if (!isset($dstHash[$id]) || $dstHash[$id] !== $srcHash[$id]) {
                $toUpsert[] = $row;
            }
        }

        // deletes (ya no existen en origen)
        $srcSet = array_fill_keys($srcIds, true);
        $toDelete = [];
        foreach ($dstIds as $id) if (!isset($srcSet[$id])) $toDelete[] = (int)$id;

        $up = 0; $del = 0;

        $this->mysql->transaction(function () use (&$up,&$del,$toUpsert,$toDelete) {
            if (!empty($toUpsert)) {
                foreach (array_chunk($toUpsert, 1000) as $chunk) {
                    $up += $this->mysql->table('bridge_roster_partido')->upsert(
                        $chunk,
                        ['roster_id'],
                        ['partido_id','equipo_id','jugador_id','es_titular']
                    );
                }
            }

            if (!empty($toDelete)) {
                foreach (array_chunk($toDelete, 1000) as $chunk) {
                    $del += $this->mysql->table('bridge_roster_partido')
                        ->whereIn('roster_id', $chunk)
                        ->delete();
                }
            }
        });

        return [
            'upserts'        => $up,
            'deleted'        => $del,
            'total_mysql'    => (int)$this->mysql->table('bridge_roster_partido')->count(),
            'mode'           => 'diff-hash + delete',
        ];
    }

    /** Espejo completo (por si quieres forzar desde consola). */
    public function syncRosterUpsertMirror(): array
    {
        [$srcRows, $srcIds, $_] = $this->readSource();

        $up = 0; $del = 0;

        $this->mysql->transaction(function () use (&$up,&$del,$srcRows,$srcIds) {
            // upsert de todo
            foreach (array_chunk($srcRows, 1000) as $chunk) {
                $up += $this->mysql->table('bridge_roster_partido')->upsert(
                    $chunk,
                    ['roster_id'],
                    ['partido_id','equipo_id','jugador_id','es_titular']
                );
            }

            // prune destino
            $dstIds = $this->mysql->table('bridge_roster_partido')->pluck('roster_id')->map(fn($v)=>(int)$v)->all();
            $srcSet = array_fill_keys($srcIds, true);
            $toDelete = [];
            foreach ($dstIds as $id) if (!isset($srcSet[$id])) $toDelete[] = $id;

            if (!empty($toDelete)) {
                foreach (array_chunk($toDelete, 1000) as $chunk) {
                    $del += $this->mysql->table('bridge_roster_partido')
                        ->whereIn('roster_id', $chunk)
                        ->delete();
                }
            }
        });

        return [
            'upserts'     => $up,
            'deleted'     => $del,
            'total_mysql' => (int)$this->mysql->table('bridge_roster_partido')->count(),
            'mode'        => 'upsert-full + prune',
        ];
    }

    /** Compat: heurística simple si la quieres seguir usando. */
    public function syncRosterIfNeeded(): ?array
    {
        $src = $this->sqlsrv->table('dbo.RosterPartido');
        $dst = $this->mysql->table('bridge_roster_partido');

        if ((int)$src->count() !== (int)$dst->count()) {
            return $this->syncRosterDiffAndDelete();
        }
        if ((int)($src->max('roster_id') ?? 0) !== (int)($dst->max('roster_id') ?? 0)) {
            return $this->syncRosterDiffAndDelete();
        }
        return null;
    }
}

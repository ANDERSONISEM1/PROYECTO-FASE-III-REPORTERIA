<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class PartidosSyncService
{
    protected $sqlsrv;
    protected $mysql;

    public function __construct()
    {
        $this->sqlsrv = DB::connection('sqlsrv_main'); // origen
        $this->mysql  = DB::connection('mysql');       // destino
    }

    /** Hash estable de campos de negocio del partido (impacta la vista). */
    private function fingerprintPartido(array $p): string
    {
        $norm = [
            'partido_id'          => (int)($p['partido_id'] ?? 0),
            'equipo_local_id'     => (int)($p['equipo_local_id'] ?? 0),
            'equipo_visitante_id' => (int)($p['equipo_visitante_id'] ?? 0),
            'fecha_hora_inicio'   => (string)($p['fecha_hora_inicio'] ?? '1970-01-01 00:00:00'),
        ];
        return sha1(json_encode($norm, JSON_UNESCAPED_UNICODE));
    }

    /**
     * Hash agregado de anotaciones por partido (suma puntos por equipo + conteo).
     * Detecta inserts/edits/deletes sin comparar fila a fila.
     */
    private function anotAggHash($builder): array
    {
        // $builder = conexión a dbo.Anotacion o fact_anotacion
        $rows = $builder->selectRaw(
            'partido_id,
             SUM(CASE WHEN equipo_id = p.equipo_local_id     THEN puntos ELSE 0 END) AS sum_local,
             SUM(CASE WHEN equipo_id = p.equipo_visitante_id THEN puntos ELSE 0 END) AS sum_visit,
             COUNT(*) AS cnt'
        )
        ->fromSub(function ($q) use ($builder) {
            // subquery necesaria para permitir join con dim_partido/dbo.Partido
            $q->from($builder->from)->select('partido_id','equipo_id','puntos');
        }, 'a')
        ->join('dim_partido as p', 'p.partido_id', '=', 'a.partido_id') // si es origen, reemplazamos join abajo
        ->groupBy('partido_id')
        ->get();

        // NOTA: el join anterior solo funciona en destino; para origen usamos otro método
        return []; // no se usa directamente: ver readSource/currentDest
    }

    /** Lee ORIGEN: partidos + hash por partido + anotaciones crudas agrupadas por partido. */
    private function readSource(): array
    {
        $ps = $this->sqlsrv->table('dbo.Partido')->select(
            'partido_id','equipo_local_id','equipo_visitante_id',
            'fecha_hora_inicio','estado','minutos_por_cuarto','cuartos_totales',
            'faltas_por_equipo_limite','faltas_por_jugador_limite','sede','fecha_creacion'
        )->orderBy('partido_id')->get();

        $payloadPart = [];
        $srcIds = [];
        $pHash = [];

        foreach ($ps as $p) {
            $row = [
                'partido_id'          => (int) $p->partido_id,
                'equipo_local_id'     => (int) $p->equipo_local_id,
                'equipo_visitante_id' => (int) $p->equipo_visitante_id,
                'fecha_hora_inicio'   => Carbon::parse($p->fecha_hora_inicio)->format('Y-m-d H:i:s'),
                'estado'              => (string) $p->estado,
                'minutos_por_cuarto'  => (int) $p->minutos_por_cuarto,
                'cuartos_totales'     => (int) $p->cuartos_totales,
                'faltas_equipo_lim'   => (int) $p->faltas_por_equipo_limite,
                'faltas_jugador_lim'  => (int) $p->faltas_por_jugador_limite,
                'sede'                => $p->sede ?: null,
                'fecha_creacion'      => Carbon::parse($p->fecha_creacion)->format('Y-m-d H:i:s'),
            ];
            $payloadPart[] = $row;
            $srcIds[] = $row['partido_id'];
            $pHash[$row['partido_id']] = $this->fingerprintPartido($row);
        }

        // Agregado de anotaciones (origen SQL Server)
        $agg = $this->sqlsrv->table('dbo.Anotacion as a')
            ->selectRaw('a.partido_id,
                         SUM(CASE WHEN a.equipo_id = p.equipo_local_id     THEN a.puntos ELSE 0 END) AS sum_local,
                         SUM(CASE WHEN a.equipo_id = p.equipo_visitante_id THEN a.puntos ELSE 0 END) AS sum_visit,
                         COUNT(*) AS cnt')
            ->join('dbo.Partido as p', 'p.partido_id', '=', 'a.partido_id')
            ->groupBy('a.partido_id')->get();

        $aggHash = [];
        foreach ($agg as $r) {
            $aggHash[(int)$r->partido_id] = sha1(json_encode([
                'L' => (int)$r->sum_local,
                'V' => (int)$r->sum_visit,
                'C' => (int)$r->cnt,
            ]));
        }

        // Anotaciones completas por partido (para refresco selectivo cuando difiere el hash)
        $anotAll = $this->sqlsrv->table('dbo.Anotacion')
            ->select('anotacion_id','partido_id','cuarto_id','equipo_id','puntos')
            ->orderBy('partido_id')->orderBy('anotacion_id')->get();

        $anotByPartido = [];
        foreach ($anotAll as $a) {
            $anotByPartido[(int)$a->partido_id][] = [
                'anotacion_id' => (int) $a->anotacion_id,
                'partido_id'   => (int) $a->partido_id,
                'cuarto_id'    => is_null($a->cuarto_id) ? null : (int) $a->cuarto_id,
                'equipo_id'    => (int) $a->equipo_id,
                'puntos'       => (int) $a->puntos,
            ];
        }

        return [$payloadPart, $srcIds, $pHash, $aggHash, $anotByPartido];
    }

    /** Lee DESTINO: hash de partido + hash agregado de anotaciones + ids actuales. */
    private function currentDest(): array
    {
        $ps = $this->mysql->table('dim_partido')->get();
        $dstIds = [];
        $pHash = [];
        foreach ($ps as $p) {
            $row = [
                'partido_id'          => (int) $p->partido_id,
                'equipo_local_id'     => (int) $p->equipo_local_id,
                'equipo_visitante_id' => (int) $p->equipo_visitante_id,
                'fecha_hora_inicio'   => Carbon::parse($p->fecha_hora_inicio)->format('Y-m-d H:i:s'),
            ];
            $dstIds[] = (int)$p->partido_id;
            $pHash[(int)$p->partido_id] = $this->fingerprintPartido($row);
        }

        $agg = $this->mysql->table('fact_anotacion as a')
            ->selectRaw('a.partido_id,
                         SUM(CASE WHEN a.equipo_id = p.equipo_local_id     THEN a.puntos ELSE 0 END) AS sum_local,
                         SUM(CASE WHEN a.equipo_id = p.equipo_visitante_id THEN a.puntos ELSE 0 END) AS sum_visit,
                         COUNT(*) AS cnt')
            ->join('dim_partido as p', 'p.partido_id', '=', 'a.partido_id')
            ->groupBy('a.partido_id')->get();

        $aggHash = [];
        foreach ($agg as $r) {
            $aggHash[(int)$r->partido_id] = sha1(json_encode([
                'L' => (int)$r->sum_local,
                'V' => (int)$r->sum_visit,
                'C' => (int)$r->cnt,
            ]));
        }

        return [$dstIds, $pHash, $aggHash];
    }

    /**
     * 🔥 Diffs (inserts/edits) + Deletes inmediatos (mirror) + refresh selectivo de anotaciones.
     */
    public function syncPartidosDiffAndDelete(): array
    {
        [$srcPart, $srcIds, $srcPHash, $srcAggHash, $anotByPartido] = $this->readSource();
        [$dstIds, $dstPHash, $dstAggHash] = $this->currentDest();

        // ---- Partidos a upsert (estructura/fecha/equipos cambiaron o no existen)
        $toUpsertPart = [];
        foreach ($srcPart as $p) {
            $id = $p['partido_id'];
            if (!isset($dstPHash[$id]) || $dstPHash[$id] !== $srcPHash[$id]) {
                $toUpsertPart[] = $p;
            }
        }

        // ---- Partidos cuyos marcadores cambiaron (hash agregado de anotaciones)
        $toRefreshAnot = [];
        foreach ($srcIds as $id) {
            $srcH = $srcAggHash[$id] ?? sha1('0-0-0');
            $dstH = $dstAggHash[$id] ?? null;
            if ($srcH !== $dstH) {
                $toRefreshAnot[] = $id;
            }
        }

        // ---- Partidos a eliminar (no existen en origen)
        $srcSet = array_fill_keys($srcIds, true);
        $toDelete = [];
        foreach ($dstIds as $id) if (!isset($srcSet[$id])) $toDelete[] = (int)$id;

        $upP = 0; $delP = 0; $softP = 0; $refA = 0; $insA = 0;

        $this->mysql->transaction(function () use (&$upP,&$delP,&$softP,&$refA,&$insA,$toUpsertPart,$toRefreshAnot,$anotByPartido,$toDelete) {
            // UPSERT de partidos
            if (!empty($toUpsertPart)) {
                foreach (array_chunk($toUpsertPart, 1000) as $chunk) {
                    $upP += $this->mysql->table('dim_partido')->upsert(
                        $chunk,
                        ['partido_id'],
                        [
                            'equipo_local_id','equipo_visitante_id','fecha_hora_inicio','estado',
                            'minutos_por_cuarto','cuartos_totales','faltas_equipo_lim',
                            'faltas_jugador_lim','sede','fecha_creacion'
                        ]
                    );
                }
            }

            // REFRESH de anotaciones por partido (solo los que cambiaron)
            if (!empty($toRefreshAnot)) {
                foreach (array_chunk($toRefreshAnot, 500) as $pidChunk) {
                    $this->mysql->table('fact_anotacion')->whereIn('partido_id', $pidChunk)->delete();
                    $refA += count($pidChunk);
                    // reinsertar
                    $bulk = [];
                    foreach ($pidChunk as $pid) {
                        if (!empty($anotByPartido[$pid])) {
                            foreach ($anotByPartido[$pid] as $row) $bulk[] = $row;
                        }
                    }
                    if (!empty($bulk)) {
                        foreach (array_chunk($bulk, 2000) as $chunk) {
                            $insA += $this->mysql->table('fact_anotacion')->insert($chunk) ? count($chunk) : 0;
                        }
                    }
                }
            }

            // DELETES de partidos inexistentes (y sus anotaciones)
            if (!empty($toDelete)) {
                foreach (array_chunk($toDelete, 500) as $pidChunk) {
                    // borrar anotaciones primero por FK
                    $this->mysql->table('fact_anotacion')->whereIn('partido_id', $pidChunk)->delete();
                    try {
                        $delP += $this->mysql->table('dim_partido')->whereIn('partido_id', $pidChunk)->delete();
                    } catch (\Throwable $e) {
                        // Fallback: baja lógica (si decides tener este campo)
                        // $softP += $this->mysql->table('dim_partido')->whereIn('partido_id', $pidChunk)->update(['estado' => 'ELIMINADO']);
                        // Si no usas baja lógica, simplemente dejamos el catch vacío.
                    }
                }
            }
        });

        return [
            'upserts_partidos'   => $upP,
            'partidos_refreshed' => $refA,
            'anots_inserted'     => $insA,
            'deleted_partidos'   => $delP,
            'soft_deleted'       => $softP,
            'total_partidos'     => (int)$this->mysql->table('dim_partido')->count(),
            'total_anots'        => (int)$this->mysql->table('fact_anotacion')->count(),
            'mode'               => 'diff-hash (partidos+marcador) + delete',
        ];
    }

    /**
     * Espejo completo: upsert TODO, refrescar TODAS las anotaciones y podar deletes.
     */
    public function syncPartidosUpsertMirror(): array
    {
        [$srcPart, $srcIds, $_pHash, $_aHash, $anotByPartido] = $this->readSource();

        $upP = 0; $delP = 0; $insA = 0;

        $this->mysql->transaction(function () use (&$upP,&$delP,&$insA,$srcPart,$srcIds,$anotByPartido) {
            // UPSERT todos los partidos
            foreach (array_chunk($srcPart, 1000) as $chunk) {
                $upP += $this->mysql->table('dim_partido')->upsert(
                    $chunk,
                    ['partido_id'],
                    [
                        'equipo_local_id','equipo_visitante_id','fecha_hora_inicio','estado',
                        'minutos_por_cuarto','cuartos_totales','faltas_equipo_lim',
                        'faltas_jugador_lim','sede','fecha_creacion'
                    ]
                );
            }

            // Refrescar TODAS las anotaciones
            $this->mysql->table('fact_anotacion')->truncate();
            $bulk = [];
            foreach ($anotByPartido as $rows) foreach ($rows as $r) $bulk[] = $r;
            foreach (array_chunk($bulk, 2000) as $chunk) {
                $insA += $this->mysql->table('fact_anotacion')->insert($chunk) ? count($chunk) : 0;
            }

            // PRUNE: eliminar partidos que no estén en origen
            $dstIds = $this->mysql->table('dim_partido')->pluck('partido_id')->map(fn($v)=>(int)$v)->all();
            $srcSet = array_fill_keys($srcIds, true);
            $toDelete = [];
            foreach ($dstIds as $id) if (!isset($srcSet[$id])) $toDelete[] = $id;

            if (!empty($toDelete)) {
                foreach (array_chunk($toDelete, 500) as $pidChunk) {
                    $this->mysql->table('fact_anotacion')->whereIn('partido_id', $pidChunk)->delete();
                    $delP += $this->mysql->table('dim_partido')->whereIn('partido_id', $pidChunk)->delete();
                }
            }
        });

        return [
            'upserts_partidos' => $upP,
            'deleted_partidos' => $delP,
            'anots_inserted'   => $insA,
            'total_partidos'   => (int)$this->mysql->table('dim_partido')->count(),
            'total_anots'      => (int)$this->mysql->table('fact_anotacion')->count(),
            'mode'             => 'upsert-full + refresh-all + prune',
        ];
    }
}

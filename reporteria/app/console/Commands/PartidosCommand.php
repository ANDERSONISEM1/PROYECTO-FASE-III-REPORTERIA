<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\PartidosSyncService;

class PartidosCommand extends Command
{
    protected $signature = 'report:sync-partidos {--force}';
    protected $description = 'Sincroniza Partidos y Anotaciones (SQL Server → MySQL)';

    public function handle(PartidosSyncService $svc)
    {
        $this->info('Sincronizando PARTIDOS + ANOTACIONES...');

        $res = $this->option('force')
            ? $svc->syncPartidosUpsertMirror()      // espejo completo (upsert + prune)
            : $svc->syncPartidosDiffAndDelete();    // diffs + deletes (selectivo)

        $this->line(json_encode($res));
        return Command::SUCCESS;
    }
}

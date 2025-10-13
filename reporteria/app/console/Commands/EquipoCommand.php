<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\EquipoSyncService;

class EquipoCommand extends Command
{
    protected $signature = 'report:sync-equipos {--force}';
    protected $description = 'Sincroniza Equipos (SQL Server → MySQL dim_equipo)';

    public function handle(EquipoSyncService $svc)
    {
        $this->info('Sincronizando EQUIPOS...');

        $res = $this->option('force')
            ? $svc->syncEquiposUpsertMirror()     // espejo completo (upsert + prune)
            : $svc->syncEquiposDiffAndDelete();   // diffs (edits/inserts) + deletes

        $this->line(json_encode($res));
        return Command::SUCCESS;
    }
}

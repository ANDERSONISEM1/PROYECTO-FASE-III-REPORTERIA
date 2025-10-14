<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\RosterSyncService;

class RosterCommand extends Command
{
    protected $signature = 'report:sync-roster {--force}';
    protected $description = 'Sincroniza Roster (convocados) SQL Server → MySQL';

    public function handle(RosterSyncService $svc)
    {
        $this->info('Sincronizando ROSTER...');

        $res = $this->option('force')
            ? $svc->syncRosterUpsertMirror()     // espejo completo (upsert + prune)
            : $svc->syncRosterDiffAndDelete();   // diffs + deletes (selectivo, “tiempo real”)

        $this->line(json_encode($res));
        return Command::SUCCESS;
    }
}

<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\JugadoresSyncService;

class JugadoresCommand extends Command
{
    protected $signature = 'report:sync-jugadores {--force}';
    protected $description = 'Sincroniza Jugadores (SQL Server → MySQL dim_jugador)';

    public function handle(JugadoresSyncService $svc)
    {
        $this->info('Sincronizando JUGADORES...');

        $res = $this->option('force')
            ? $svc->syncJugadoresUpsertMirror()   // espejo completo (upsert + prune)
            : $svc->syncJugadoresDiffAndDelete(); // diffs (edits/inserts) + deletes

        $this->line(json_encode($res));
        return Command::SUCCESS;
    }
}

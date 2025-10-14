<?php



use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',        // 👈 IMPORTANTE
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function
     (Middleware $middleware): void {
        //
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();

/*




    echo "=== CONTENEDORES ==="
docker ps -a
echo ""

echo "=== IMÁGENES ==="
docker images
echo ""

echo "=== VOLÚMENES ==="
docker volume ls
echo ""

echo "=== REDES ==="
docker network ls
echo ""

echo "=== USO DEL SISTEMA ==="
docker system df
*/
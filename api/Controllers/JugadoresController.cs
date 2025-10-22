// Api/Controllers/JugadoresController.cs
using Microsoft.AspNetCore.Mvc;
using Api.Data;

namespace Api.Controllers;

// Controlador para operaciones relacionadas con jugadores
// Comentarios mínimos: explica el propósito y el endpoint principal
[ApiController]
[Route("api/[controller]")]
public class JugadoresController : ControllerBase
{
    // Repositorio para acceder a datos de jugadores (Consultas simples)
    private readonly JugadoresRepo _repo;
    public JugadoresController(JugadoresRepo repo) => _repo = repo;

    // GET: /api/jugadores/por-equipo/{equipoId}?activos=true
    // Devuelve los jugadores de un equipo. Parámetro 'activos' permite filtrar.
    [HttpGet("por-equipo/{equipoId:int}")]
    public async Task<IActionResult> GetPorEquipo(int equipoId, [FromQuery] bool activos = true)
    {
        if (equipoId <= 0) return BadRequest(new { error = "equipoId inválido" });
        var data = await _repo.GetJugadoresPorEquipoAsync(equipoId, activos);
        return Ok(data);
    }
}

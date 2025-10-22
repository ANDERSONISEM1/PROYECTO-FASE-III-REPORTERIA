using Microsoft.AspNetCore.Mvc;
using Api.Data;
using Api.Models;
using Microsoft.AspNetCore.Authorization;
namespace Api.Controllers
{
    [ApiController]
    [Route("api/inicio")]
     [Authorize(Roles = "ADMINISTRADOR, USUARIO")]
    public class InicioController : ControllerBase
    {
        // Controlador que expone datos para el dashboard/portada
        private readonly InicioRepo _repo;
        private readonly EquiposRepo _equipos;
        public InicioController(InicioRepo repo, EquiposRepo equipos)
        {
            _repo = repo;
            _equipos = equipos;
        }

        // KPIs principales para el panel de inicio
        [HttpGet("kpis")]
        public async Task<ActionResult<InicioKpisDto>> GetKpis()
            => Ok(await _repo.GetKpisAsync());

        // Próximo partido (si hay), devuelve 204 si no existe
        [HttpGet("proximo")]
        public async Task<ActionResult<ProximoPartidoDto>> GetProximo()
        {
            var row = await _repo.GetProximoPartidoAsync();
            return row is null ? NoContent() : Ok(row);
        }

        // Lista de equipos para mostrar nombres en UI
        [HttpGet("equipos")]
        public async Task<ActionResult> GetEquipos()
            => Ok(await _equipos.GetAllAsync());
    }
}

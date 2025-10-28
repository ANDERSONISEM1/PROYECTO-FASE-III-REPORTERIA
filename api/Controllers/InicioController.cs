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
        private readonly InicioRepo _repo;
        // private readonly EquiposRepo _equipos; // ELIMINADO - Movido a Java API
        public InicioController(InicioRepo repo)
        {
            _repo = repo;
            // _equipos = equipos; // ELIMINADO - Movido a Java API
        }

        [HttpGet("kpis")]
        public async Task<ActionResult<InicioKpisDto>> GetKpis()
            => Ok(await _repo.GetKpisAsync());

        [HttpGet("proximo")]
        public async Task<ActionResult<ProximoPartidoDto>> GetProximo()
        {
            var row = await _repo.GetProximoPartidoAsync();
            return row is null ? NoContent() : Ok(row);
        }

       
    }
}
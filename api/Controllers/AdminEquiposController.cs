// ======================= Api.Controllers/AdminEquiposController.cs =======================
using Microsoft.AspNetCore.Mvc;
using Api.Data;
using Api.Models;
using Microsoft.AspNetCore.Authorization;

namespace Api.Controllers
{
    // Controlador para la administración de equipos (solo para rol ADMINISTRADOR)
    [ApiController]
    [Route("api/admin/equipos")]
    [Authorize(Roles = "ADMINISTRADOR")]
    public class AdminEquiposController : ControllerBase
    {
    // Repositorio para operaciones CRUD sobre equipos
    private readonly EquiposRepo _repo;
    // Inyección de dependencias del repositorio
    public AdminEquiposController(EquiposRepo repo) => _repo = repo;

        // GET: api/admin/equipos
        // Devuelve todos los equipos registrados
        [HttpGet]
        public async Task<ActionResult<IEnumerable<EquipoDto>>> GetAll()
            => Ok(await _repo.GetAllAsync());

        // GET: api/admin/equipos/{id}
        // Devuelve los datos de un equipo por su ID
        [HttpGet("{id:int}")]
        public async Task<ActionResult<EquipoDto>> GetById(int id)
        {
            var row = await _repo.GetByIdAsync(id);
            return row is null ? NotFound() : Ok(row);
        }

        // GET: api/admin/equipos/{id}/delete-info
        // Devuelve información para el modal de eliminación (jugadores y resumen de partidos)
        [HttpGet("{id:int}/delete-info")]
        public async Task<ActionResult<EquipoDeleteInfoDto>> GetDeleteInfo(int id)
            => Ok(await _repo.GetDeleteInfoAsync(id));

        // POST: api/admin/equipos
        // Crea un nuevo equipo. Valida nombre requerido y único.
        [HttpPost]
        public async Task<ActionResult<EquipoDto>> Create([FromBody] CreateEquipoRequest body)
        {
            if (string.IsNullOrWhiteSpace(body?.Nombre))
                return BadRequest(new { error = "Nombre requerido." });

            var nombre = body.Nombre.Trim();

            // Validación de nombre único
            if (await _repo.ExistsByNameAsync(nombre))
                return Conflict(new { error = "Ya existe un equipo con ese nombre." });

            var id = await _repo.CreateAsync(body);
            var dto = await _repo.GetByIdAsync(id);
            return CreatedAtAction(nameof(GetById), new { id }, dto);
        }

        // PUT: api/admin/equipos/{id}
        // Actualiza los datos de un equipo existente. Valida nombre requerido y único.
        [HttpPut("{id:int}")]
        public async Task<ActionResult> Update(int id, [FromBody] UpdateEquipoRequest body)
        {
            if (string.IsNullOrWhiteSpace(body?.Nombre))
                return BadRequest(new { error = "Nombre requerido." });

            var nombre = body.Nombre.Trim();

            // Validación de nombre único (excluyendo el propio id)
            if (await _repo.ExistsByNameExceptIdAsync(id, nombre))
                return Conflict(new { error = "Ya existe otro equipo con ese nombre." });

            var n = await _repo.UpdateAsync(id, body);
            return n == 0 ? NotFound() : NoContent();
        }

        // DELETE: api/admin/equipos/{id}
        // Elimina un equipo por su ID. Si participa en partidos, bloquea la eliminación.
        [HttpDelete("{id:int}")]
        public async Task<ActionResult> Delete(int id)
        {
            var n = await _repo.DeleteAsync(id);
            if (n == -2)
                return Conflict(new { error = "No se puede eliminar: el equipo participa en partidos. Elimine esos partidos primero." });
            return n == 0 ? NotFound() : NoContent();
        }

        // GET: api/admin/equipos/{id}/logo
        // Devuelve el logo del equipo en formato binario
        [HttpGet("{id:int}/logo")]
        public async Task<IActionResult> GetLogo(int id)
        {
            var (logo, contentType) = await _repo.GetLogoAsync(id);
            if (logo == null) return NotFound();
            return File(logo, contentType ?? "application/octet-stream");
        }
    }
}

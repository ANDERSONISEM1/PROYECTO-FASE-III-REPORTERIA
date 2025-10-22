root@vmi2825921:/opt/PROYECTO-FASE-III-REPORTERIA/api# root@vmi2825921:/opt/PROYECTO-FASE-III-REPORTERIA/api# cat Program.cs
using Api.Data;
using Api.Hubs;
using Api.Models;
using Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Swagger & SignalR
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSignalR();

// Controllers
builder.Services.AddControllers();

// Repos existentes
builder.Services.AddScoped<MarcadorRepo>();
builder.Services.AddScoped<JugadoresRepo>();
builder.Services.AddScoped<FaltasRepo>();
builder.Services.AddScoped<TiemposMuertosRepo>();
builder.Services.AddScoped<PartidosRepo>();
builder.Services.AddScoped<CronometroRepo>();
builder.Services.AddScoped<CuartosRepo>();
builder.Services.AddScoped<EquiposRepo>();
builder.Services.AddScoped<JugadorRepo>();
builder.Services.AddScoped<PartidosCrudRepo>();
builder.Services.AddScoped<HistorialRepo>();
builder.Services.AddScoped<InicioRepo>();
builder.Services.AddScoped<AjustesRepo>();

// DB wrapper
builder.Services.AddSingleton<Db>();

// === Auth / JWT ===
var jwtSection = builder.Configuration.GetSection("Jwt");
var jwtCfg = jwtSection.Get<JwtSettings>()!;
builder.Services.AddSingleton(jwtCfg);
builder.Services.AddSingleton<JwtTokenService>();
builder.Services.AddScoped<AuthRepo>();

if (string.IsNullOrWhiteSpace(jwtCfg.Issuer) ||
    string.IsNullOrWhiteSpace(jwtCfg.Audience) ||
    string.IsNullOrWhiteSpace(jwtCfg.Key))
{
    throw new InvalidOperationException(
        $"Config Jwt incompleta. Issuer='{jwtCfg.Issuer}', Audience='{jwtCfg.Audience}', KeyLen={(jwtCfg.Key ?? "").Length}");
}

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        // Acepta múltiples 'aud' para no romper con los tokens emitidos
        var validAudiences = new[]
        {
            jwtCfg.Audience,                     // lo configurado en appsettings.json
            "http://localhost:5080/",            // el 'aud' que trae tu token actual
            "https://uniondeprofesionales.com/"  // por si emites así en adelante
        };

        options.TokenValidationParameters = new()
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtCfg.Issuer,
            ValidAudiences = validAudiences,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtCfg.Key)),
            NameClaimType = ClaimTypes.Name,
            RoleClaimType = ClaimTypes.Role,
            ClockSkew = TimeSpan.Zero
        };

        // Soporte para SignalR con token en querystring + normalización de roles
        options.Events = new JwtBearerEvents
        {
            OnAuthenticationFailed = ctx =>
            {
                Console.WriteLine("JWT fail: " + ctx.Exception?.Message);
                return Task.CompletedTask;
            },
            OnMessageReceived = ctx =>
            {
                var accessToken = ctx.Request.Query["access_token"];
                var path = ctx.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hub"))
                    ctx.Token = accessToken;

                var id = ctx.Principal?.Identity as ClaimsIdentity;
                var rolesJson = id?.FindFirst("role")?.Value;
                if (!string.IsNullOrWhiteSpace(rolesJson) && rolesJson.TrimStart().StartsWith("["))
                {
                    var roles = System.Text.Json.JsonSerializer.Deserialize<string[]>(rolesJson) ?? Array.Empty<string>();
                    foreach (var r in roles)
                        id!.AddClaim(new Claim("role", r));
                }
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();

// ===== CORS PRODUCCIÓN =====
const string CorsProd = "cors-prod";
var allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
<<<<<<< HEAD
    .Get<string[]>() ?? new[] { "https://uniondeprofesionales.com" };
=======
    .Get<string[]>() ?? new[] { "https://uniondeprofesionales.com", "https://www.uniondeprofesionales.com" };
>>>>>>> 398cb06 (Actualizaciones realizadas directamente desde la VPS (auth, environment, docker-compose, etc.))

builder.Services.AddCors(opt =>
{
    opt.AddPolicy(CorsProd, p =>
        p.WithOrigins(allowedOrigins)
         .AllowAnyHeader()
         .AllowAnyMethod()
<<<<<<< HEAD
         .AllowCredentials() // si no usas cookies, puedes quitarlo
=======
         .AllowCredentials()
>>>>>>> 398cb06 (Actualizaciones realizadas directamente desde la VPS (auth, environment, docker-compose, etc.))
    );
});

// Seeds al arrancar
builder.Services.AddHostedService<RolesBootstrap>();

// Kestrel: escuchar en todas las IPs
builder.WebHost.UseKestrel();
builder.WebHost.ConfigureKestrel(o => { o.ListenAnyIP(5080); });

var app = builder.Build();

// Swagger (ok en prod para ti ahora)
app.UseSwagger();
app.UseSwaggerUI();

app.UseRouting();

// CORS antes de Auth
app.UseCors(CorsProd);

app.UseAuthentication();
app.UseAuthorization();

// Healthcheck público
app.MapGet("/healthz", () => Results.Ok(new
{
    status = "ok",
    env = app.Environment.EnvironmentName,
    timestamp = DateTime.UtcNow
}));

app.MapHub<MarcadorHub>("/hub/marcador");

app.MapControllers();

<<<<<<< HEAD
app.Run();
=======
app.Run();

>>>>>>> 398cb06 (Actualizaciones realizadas directamente desde la VPS (auth, environment, docker-compose, etc.))

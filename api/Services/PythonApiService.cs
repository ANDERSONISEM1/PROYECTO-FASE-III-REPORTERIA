using System.Text.Json;
using Api.Models;

namespace Api.Services
{
    public class PythonApiService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<PythonApiService> _logger;
        private readonly string _pythonApiBaseUrl;

        public PythonApiService(HttpClient httpClient, ILogger<PythonApiService> logger, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _logger = logger;
            _pythonApiBaseUrl = configuration.GetValue<string>("PythonApi:BaseUrl") ?? "http://python-api:5082";
        }

        public async Task<IEnumerable<PythonPartidoDto>?> GetPartidosAsync(int? equipoId = null)
        {
            try
            {
                var url = $"{_pythonApiBaseUrl}/api/games/";
                if (equipoId.HasValue)
                {
                    url += $"?team_id={equipoId.Value}";
                }

                _logger.LogInformation("Calling Python API: {Url}", url);
                
                var response = await _httpClient.GetAsync(url);
                
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Python API returned {StatusCode}: {ReasonPhrase}", 
                        response.StatusCode, response.ReasonPhrase);
                    return null;
                }

                var jsonContent = await response.Content.ReadAsStringAsync();
                var options = new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                    PropertyNameCaseInsensitive = true
                };

                var partidos = JsonSerializer.Deserialize<List<PythonPartidoDto>>(jsonContent, options);
                
                _logger.LogInformation("Retrieved {Count} partidos from Python API", partidos?.Count ?? 0);
                
                return partidos;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calling Python API for partidos");
                return null;
            }
        }

        public async Task<IEnumerable<PythonGameEventDto>?> GetHistorialEventosAsync(int partidoId)
        {
            try
            {
                var url = $"{_pythonApiBaseUrl}/api/games/{partidoId}/events";
                
                _logger.LogInformation("Calling Python API for events: {Url}", url);
                
                var response = await _httpClient.GetAsync(url);
                
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Python API returned {StatusCode} for events: {ReasonPhrase}", 
                        response.StatusCode, response.ReasonPhrase);
                    return null;
                }

                var jsonContent = await response.Content.ReadAsStringAsync();
                var options = new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                    PropertyNameCaseInsensitive = true
                };

                var eventos = JsonSerializer.Deserialize<List<PythonGameEventDto>>(jsonContent, options);
                
                _logger.LogInformation("Retrieved {Count} events from Python API", eventos?.Count ?? 0);
                
                return eventos;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calling Python API for events of partido {PartidoId}", partidoId);
                return null;
            }
        }

        public async Task<bool> HealthCheckAsync()
        {
            try
            {
                var url = $"{_pythonApiBaseUrl}/health";
                var response = await _httpClient.GetAsync(url);
                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Python API health check failed");
                return false;
            }
        }
    }

    // DTOs para la comunicación con Python API
    public record PythonPartidoDto(
        int Id,
        int HomeTeamId,
        int AwayTeamId,
        int HomeScore,
        int AwayScore,
        int Quarter,
        string TimeRemaining,
        string GameStatus,
        DateTime GameDate,
        string? Venue,
        DateTime CreatedAt,
        DateTime UpdatedAt,
        PythonTeamDto? HomeTeam,
        PythonTeamDto? AwayTeam
    );

    public record PythonTeamDto(
        int Id,
        string Name,
        string? City,
        string? LogoUrl,
        int? FoundedYear,
        bool IsActive,
        DateTime CreatedAt,
        DateTime UpdatedAt
    );

    public record PythonGameEventDto(
        int Id,
        int GameId,
        int? TeamId,
        string EventType,
        string? EventDescription,
        int Points,
        int? Quarter,
        string? TimeInQuarter,
        DateTime CreatedAt
    );
}

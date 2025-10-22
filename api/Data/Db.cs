// Api/Data/Db.cs
using System.Data;
using Microsoft.Data.SqlClient;

namespace Api.Data;

public class Db
{
    private readonly string _cs;
    // Wrapper ligero para abrir conexiones a la base de datos.
    // Lee la cadena de conexión con nombre "Default" desde IConfiguration y la guarda.
    // Lanzará InvalidOperationException si no existe la cadena.
    public Db(IConfiguration cfg)
        => _cs = cfg.GetConnectionString("Default")
                 ?? throw new InvalidOperationException("Falta connection string 'Default'.");

    // Abre una conexión sincrónica y la retorna ya abierta.
    // El llamador es responsable de disponer/usar la conexión dentro de using.
    public IDbConnection Open()
    {
        var cn = new SqlConnection(_cs);
        cn.Open();
        return cn;
    }

    // Variante asíncrona de Open(). Utilizar cuando se requiera no bloquear el hilo.
    public async Task<IDbConnection> OpenAsync()
    {
        var cn = new SqlConnection(_cs);
        await cn.OpenAsync();
        return cn;
    }
}

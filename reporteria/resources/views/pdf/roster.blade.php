<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>{{ $meta['titulo'] }}</title>
  <style>
    body { font-family: DejaVu Sans, Arial, sans-serif; font-size: 12px; color: #222; }
    h1 { font-size: 18px; margin: 0 0 6px; text-align: center; }
    .meta { margin-bottom: 12px; text-align: center; }
    .meta div { margin: 2px 0; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #ccc; padding: 6px 8px; }
    th { background: #f2f2f2; text-align: left; }
    .center { text-align: center; }
    .right { text-align: right; }
  </style>
</head>
<body>
  <h1>{{ $meta['titulo'] }}</h1>
  <div class="meta">
    <div><strong>Partido:</strong> {{ $meta['partido'] }}</div>
   <!-- <div><strong>Rango:</strong> {{ $meta['rango'] }}</div>-->
   <!--  <div><strong>Alcance:</strong> {{ $meta['alcance'] }}</div>-->
    <div><strong>Generado:</strong> {{ $meta['generado'] }}</div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Equipo</th>
        <th>Jugador</th>
        <th class="center">Dorsal</th>
        <th>Posición</th>
      </tr>
    </thead>
    <tbody>
      @forelse ($rows as $r)
        <tr>
          <td>{{ $r->equipo }}</td>
          <td>{{ $r->jugador }}</td>
          <td class="center">{{ $r->dorsal ?? '' }}</td>
          <td>{{ $r->posicion ?? '' }}</td>
        </tr>
      @empty
        <tr><td colspan="4" class="center">Sin datos</td></tr>
      @endforelse
    </tbody>
  </table>
</body>
</html>

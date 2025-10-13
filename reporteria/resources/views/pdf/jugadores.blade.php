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
    .right { text-align: right; }
    .center { text-align: center; }
  </style>
</head>
<body>
  <h1>{{ $meta['titulo'] }}</h1>
  <div class="meta">
    <div><strong>Equipo:</strong> {{ $meta['equipo'] }}</div>
 <!--    <div><strong>Rango:</strong> {{ $meta['rango'] }}</div> -->
  <!--     <div><strong>Alcance:</strong> {{ $meta['alcance'] }}</div>  NUEVO -->
    <div><strong>Generado:</strong> {{ $meta['generado'] }}</div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Nombres</th>
        <th>Apellidos</th>
        <th class="center">Dorsal</th>
        <th>Posición</th>
        <th class="right">Estatura (cm)</th>
        <th class="right">Edad</th>
        <th>Nacionalidad</th>
        <th class="center">Activo</th>
      </tr>
    </thead>
    <tbody>
      @forelse ($rows as $r)
        <tr>
          <td>{{ $r->nombres }}</td>
          <td>{{ $r->apellidos }}</td>
          <td class="center">{{ $r->dorsal ?? '' }}</td>
          <td>{{ $r->posicion ?? '' }}</td>
          <td class="right">{{ $r->estatura_cm ?? '' }}</td>
          <td class="right">{{ $r->edad ?? '' }}</td>
          <td>{{ $r->nacionalidad ?? '' }}</td>
          <td class="center">{{ (int)$r->activo === 1 ? 'Sí' : 'No' }}</td>
        </tr>
      @empty
        <tr><td colspan="8" class="center">Sin datos</td></tr>
      @endforelse
    </tbody>
  </table>
</body>
</html>
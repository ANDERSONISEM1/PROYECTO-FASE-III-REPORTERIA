export const environment = {
  production: true,
  // APIs por funcionalidad
  apiBaseLogin: 'https://apilogin.mundoalonzo.com',
  apiJava: 'http://localhost:5081',      // Equipos y Jugadores (CRUD)
  apiPython: 'http://localhost:5082',    // Partidos e Historial
  apiDotNet: 'http://localhost:5080',    // KPIs y Dashboard
  // Compatibilidad (deprecated - usar apis específicas)
  apiBase: 'http://localhost:5080'
};

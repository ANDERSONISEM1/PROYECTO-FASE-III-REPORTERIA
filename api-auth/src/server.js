// src/server.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { connect } = require("./db");

// Rutas
const loginRoutes = require("./routes/auth.login");
const registerRoutes = require("./routes/auth.register");
const healthRoutes = require("./routes/health");
const githubAuthRoutes = require("./routes/auth.github");

async function bootstrap() {
  await connect();
  console.log("Conectado a MongoDB");

  const app = express();

  // ---- Middlewares base (en orden) ----
  // CORS
  const allowedOrigins = (process.env.FRONTEND_URLS || "http://localhost:4200")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin: (origin, cb) => {
        // permitir Postman/insomnia (sin Origin) y orígenes de la lista
        if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
        return cb(new Error("CORS no permitido para el origen: " + origin));
      },
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: false,
    })
  );
  app.use((req, res, next) => {
    res.header("Vary", "Origin");
    next();
  });

  // Seguridad
  app.use(helmet());

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Logs
  app.use(morgan("dev"));

  // ---- Rutas ----
  app.use("/auth", registerRoutes);
  app.use("/auth", loginRoutes);
  app.use("/", healthRoutes);

  app.use(githubAuthRoutes);

  const port = process.env.PORT || 3000;
  app.listen(port, () =>
    console.log(`API escuchando en http://localhost:${port}`)
  );
}

bootstrap().catch((err) => {
  console.error(" Error iniciando el servidor:", err);
  process.exit(1);
});

const { z } = require("zod");
const authService = require("../services/auth.service");
const { ROLES } = require("../constants/roles");
// Validaciones
const registerSchema = z.object({
  nombre: z.string().min(2, "El nombre es obligatorio"),
  email: z.string().email(),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  direccion: z.string().optional(),
  role: z.enum(ROLES).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

async function register(req, res) {
  try {
    const data = registerSchema.parse(req.body);
    const result = await authService.register(data);
    return res.status(201).json(result);
  } catch (err) {
    // 🔎 LOG al contenedor (aparece en: docker logs -f api-auth)
    console.error("❌ register() failed:", {
      message: err?.message,
      code: err?.code,
      name: err?.name,
      stack: err?.stack,
      body: req.body,
    });

    if (err?.issues) {
      return res
        .status(400)
        .json({ error: "Datos inválidos", details: err.issues });
    }
    if (err?.code === "EMAIL_DUPLICADO") {
      return res.status(409).json({ error: "Email ya registrado" });
    }
    // Mongoose duplicado crudo
    if (err?.code === 11000 && err?.keyPattern?.email) {
      return res.status(409).json({ error: "Email ya registrado" });
    }

    return res.status(500).json({ error: "Error registrando usuario" });
  }
}

async function login(req, res) {
  try {
    const data = loginSchema.parse(req.body);
    const result = await authService.login(data);
    // El servicio devuelve { token }
    return res.json(result);
  } catch (err) {
    if (err?.issues)
      return res
        .status(400)
        .json({ error: "Datos inválidos", details: err.issues });
    if (err?.code === "CREDENCIALES_INVALIDAS")
      return res.status(401).json({ error: "Credenciales inválidas" });
    return res.status(500).json({ error: "Error en login" });
  }
}

module.exports = { register, login };

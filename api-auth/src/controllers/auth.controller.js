const { z } = require('zod');
const authService = require('../services/auth.service');


// Validaciones
const registerSchema = z.object({
nombre: z.string().min(2, 'El nombre es obligatorio'),
email: z.string().email(),
password: z.string().min(8, 'Mínimo 8 caracteres'),
direccion: z.string().optional()
});


const loginSchema = z.object({
email: z.string().email(),
password: z.string().min(8)
});


async function register(req, res) {
try {
const data = registerSchema.parse(req.body);
const result = await authService.register(data);
// El servicio devuelve { id, nombre, email, direccion }
return res.status(201).json(result);
} catch (err) {
if (err?.issues) return res.status(400).json({ error: 'Datos inválidos', details: err.issues });
if (err?.code === 'EMAIL_DUPLICADO') return res.status(409).json({ error: 'Email ya registrado' });
return res.status(500).json({ error: 'Error registrando usuario' });
}
}


async function login(req, res) {
try {
const data = loginSchema.parse(req.body);
const result = await authService.login(data);
// El servicio devuelve { token }
return res.json(result);
} catch (err) {
if (err?.issues) return res.status(400).json({ error: 'Datos inválidos', details: err.issues });
if (err?.code === 'CREDENCIALES_INVALIDAS') return res.status(401).json({ error: 'Credenciales inválidas' });
return res.status(500).json({ error: 'Error en login' });
}
}


module.exports = { register, login };
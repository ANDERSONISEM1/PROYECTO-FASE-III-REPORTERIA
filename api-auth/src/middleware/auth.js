const jwt = require('jsonwebtoken');


function auth(req, res, next) {
const authHeader = req.get('authorization') || '';
const token = authHeader.toLowerCase().startsWith('bearer ')
? authHeader.slice(7)
: null;


if (!token) return res.status(401).json({ error: 'Token requerido en Authorization: Bearer <token>' });
try {
const payload = jwt.verify(token, process.env.JWT_SECRET);
req.user = { id: payload.sub, email: payload.email, nombre: payload.nombre };
return next();
} catch (e) {
return res.status(401).json({ error: 'Token inválido o expirado' });
}
}


module.exports = auth;
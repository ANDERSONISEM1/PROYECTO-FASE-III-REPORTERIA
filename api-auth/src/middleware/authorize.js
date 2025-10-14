function authorize(...allowedRoles) {
  return (req, res, next) => {
    const role = req.user?.role;
    if (!role) return res.status(401).json({ error: "No autenticado" });
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ error: "No autorizado" });
    }
    next();
  };
}
module.exports = authorize;

async function me(req, res) {
const User = require('../models/user');
const user = await User.findById(req.user.id).select('_id nombre email direccion createdAt');
return res.json({ user });
}


module.exports = { me };
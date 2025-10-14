require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { connect } = require('./db');


const loginRoutes = require('./routes/auth.login');
const registerRoutes = require('./routes/auth.register');
const healthRoutes = require('./routes/health');


async function bootstrap() {
await connect();


const app = express();
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(morgan('dev'));


app.use('/auth', registerRoutes);
app.use('/auth', loginRoutes);
app.use('/', healthRoutes);


const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`API escuchando en http://localhost:${port}`));
}


bootstrap().catch((err) => {
console.error(' Error iniciando el servidor:', err);
process.exit(1);
});
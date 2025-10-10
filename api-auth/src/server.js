require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { connect } = require('./db');


const authRoutes = require('./routes/auth');
const healthRoutes = require('./routes/health');


async function bootstrap() {
await connect();


const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));


app.use('/auth', authRoutes);
app.use('/', healthRoutes);


const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`API escuchando en http://localhost:${port}`));
}


bootstrap().catch((err) => {
console.error('Error iniciando el servidor:', err);
process.exit(1);
});
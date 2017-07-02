// si estamos en desarrollo, requerimos el archivo '.env'
// en producción esa configuración se recibe como variables de entorno
if (process.env.NODE_ENV === 'development') {
    require('dotenv').config();
}

const microCors = require('micro-cors');
const { send } = require('micro');
const run = require('./program');

const cors = microCors({
    allowMethods: ['GET']
});

async function handler (req, res) {
    send(res, 200, {
        running: true
    });
}

// ejecuta el bot
run();

// expongo el endpoint para saber si el servicio está activo
module.exports = cors(handler);

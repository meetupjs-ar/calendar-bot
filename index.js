// si estamos en desarrollo, requerimos el archivo '.env'
// en producción esa configuración se recibe como variables de entorno
if (process.env.NODE_ENV === 'development') {
    require('dotenv').config();
}

const bot = require('./src/bot');
const { get, router } = require('microrouter');
const microCors = require('micro-cors');
const routes = require('./src/routes');

// configuración de cors
const cors = microCors({ allowMethods: ['GET'] });

// inicia del bot con su respectivo setInterval
bot.run();

// exponemos las rutas disponibles para este microservicio usando cors
module.exports = cors(
    router(
        get('/', routes.index),
        get('/force-calendar', routes.forceCalendar),
        get('/*', routes.notfound)
    )
);

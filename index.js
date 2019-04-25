// si estamos en desarrollo, requerimos el archivo '.env'
// en producción esa configuración se recibe como variables de entorno
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

const calendarBot = require('./src/bot')
const birthdayBot = require('./src/birthdayBot')
const { get, post, router } = require('microrouter')
const microCors = require('micro-cors')
const routes = require('./src/routes')

// configuración de cors
const cors = microCors({ allowMethods: ['GET', 'POST'] })

// inicia del bot con su respectivo setInterval
calendarBot.run()

// inicia del bot con su respectivo setInterval
birthdayBot.run()

// exponemos las rutas disponibles para este microservicio usando cors
module.exports = cors(
    router(
        get('/', routes.index),
        get('/info', routes.info),
        post('/send/birthday-message', birthdayBot.sendMessage),
        get('/assets/:file.:ext', routes.avatar),
        get('/*', routes.notfound)
    )
)

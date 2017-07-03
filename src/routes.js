const bot = require('./bot');
const { send } = require('micro');

function forceCalendar (req, res) {
    // forzamos la ejecución del bot (recordar que es un proceso asíncrono)
    bot.sendSlackMessage();

    // avisamos que el proceso fue desencadenado (no confundir con terminado)
    send(res, 200, { triggered: true });
}

function index (req, res) {
    send(res, 200, { active: true });
}

function notfound (req, res) {
    send(res, 404, 'Not found');
}

module.exports = {
    forceCalendar,
    index,
    notfound
};

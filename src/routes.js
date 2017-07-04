const bot = require('./bot');
const fs = require('fs');
const path = require('path');
const { send } = require('micro');

function avatar (req, res) {
    try {
        const filePath = path.join(
            __dirname,
            '..',
            'assets',
            `${req.params.file}.${req.params.ext}`
        );
        const avatar = fs.readFileSync(filePath);

        send(res, 200, avatar);
    } catch (error) {
        send(res, 404, 'Not found');
    }
}

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
    avatar,
    forceCalendar,
    index,
    notfound
};

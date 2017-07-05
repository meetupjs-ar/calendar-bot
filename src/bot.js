// modulos necesarios
const got = require('got');
const moment = require('moment-timezone');
const Slack = require('slack-node');

// constantes
const FOOTER = '\n\nPara conocer los eventos que se vienen visitá: http://meetupjs.com.ar/calendario.html';
const HEADER = 'Estos son los eventos del día de hoy :simple_smile:\n\n\n\n\n';
const ZONE = 'America/Buenos_Aires';

function executeProgram () {
    const jobTime = moment.tz(new Date(), ZONE);

    if (jobTime.hour() === 8) {
        sendSlackMessage();
    }
}

function run () {
    // se ejecuta el programa una vez por hora
    setInterval(executeProgram, 1000 * 60 * 60);
}

function sendSlackMessage () {
    // llamamos al API para pedir los eventos
    return got(process.env.CALENDAR_API_URL)

        // obtengo el body
        .then(res => res.body)

        // parseo los resultados
        .then(JSON.parse)

        // selecciono el primer elemento del calendario que corresponde al mes actual
        .then(calendars => calendars[0])

        // descarto los eventos que no pertenecen al día de hoy
        .then(currentMonthCalendar => {
            return eventsOfTheDay = currentMonthCalendar.events.filter(event => {
                const eventDate = moment.tz(new Date(event.date), ZONE);
                const today = moment(new Date(), ZONE);

                return eventDate.isSame(today, 'days');
            });
        })

        // Verifico que haya eventos para mostrar
        .then(eventsOfTheDay => {
            if (!eventsOfTheDay.length) {
                return Promise.reject(`Hoy no hay eventos: ${moment.tz(new Date(), ZONE).format()}`);
            }

            return eventsOfTheDay;
        })

        // construyo un string con la información que quiero mostrar
        .then(eventsOfTheDay => {
            let eventsMessage = '';

            eventsOfTheDay.forEach(event => {
                eventsMessage = eventsMessage
                    + `*${event.eventName}*`
                    + `\n> _${event.place}_`
                    + `\n> ${event.eventLink}\n\n\n`;
            });

            return eventsMessage;
        })

        // agrego un header y un footer
        .then(eventsMessage => `${HEADER}${eventsMessage}${FOOTER}`)

        // envío el mensaje a Slack
        .then(message => {
            const messageOptions = {
                channel: process.env.CHANNEL,
                icon_emoji: process.env.BOT_AVATAR,
                text: message,
                username: process.env.BOT_NAME
            };
            const slack = new Slack();

            slack.setWebhook(process.env.SLACK_WEBHOOK_URL);
            slack.webhook(messageOptions, (error, response) => {
                if (error) {
                    return console.error(error);
                }

                return console.log(response);
            });
        })

        // en caso de error, solo lo muestro por la consola
        .catch(error => console.error(error));
}

module.exports = {
    run,
    sendSlackMessage
};

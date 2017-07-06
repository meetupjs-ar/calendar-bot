const CronJob = require('cron').CronJob;
const got = require('got');
const moment = require('moment-timezone');
const Slack = require('slack-node');

// constantes
const AFTERNOON_HEADER = 'Estos son los eventos de mañana :simple_smile:\n\n\n\n\n';
const FOOTER = '\n\nEl calendario de eventos completo lo podés mirar en http://meetupjs.com.ar/calendario.html';
const MORNING_HEADER = 'Estos son los eventos de hoy :simple_smile:\n\n\n\n\n';
const ZONE = 'America/Buenos_Aires';

function run () {
    // por la mañana
    new CronJob(
        '00 30 08 * * *',
        () => {
            // genera un mensaje custom según la hora del día (mañana o tarde)
            const messageTemplateBuilder = message => `${MORNING_HEADER}${message}${FOOTER}`;
            // fecha para filtrar eventos (puede ser el mismo día o el día siguiente)
            const deadline = moment(new Date(), ZONE);

            sendSlackMessage(deadline, messageTemplateBuilder);
        },
        null,
        true,
        ZONE
    );

    // por la tarde
    new CronJob(
        '00 30 17 * * *',
        () => {
            // genera un mensaje custom según la hora del día (mañana o tarde)
            const messageTemplateBuilder = message => `${AFTERNOON_HEADER}${message}${FOOTER}`;
            // fecha para filtrar eventos (puede ser el mismo día o el día siguiente)
            const deadline = moment(new Date(), ZONE).add(1, 'days');

            sendSlackMessage(deadline, messageTemplateBuilder);
        },
        null,
        true,
        ZONE
    );
}

function sendSlackMessage (deadline, messageTemplateBuilder) {
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

                return eventDate.isSame(deadline, 'days');
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
        .then(messageTemplateBuilder)

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

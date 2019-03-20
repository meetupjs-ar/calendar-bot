const CronJob = require('cron').CronJob
const got = require('got')
const moment = require('moment-timezone')
const shuffle = require('knuth-shuffle').knuthShuffle
const Slack = require('slack-node')

moment.locale('es')

// constantes
const AFTERNOON_HEADER = 'Estos son los eventos de mañana :simple_smile:\n\n'
const FOOTER =
    'El calendario de eventos completo lo podés mirar en http://meetupjs.com.ar/calendario.html'
const HODOR_FOOTER =
    'Hodor hodor hodor hodor hodor hodor hodor hodor hodor http://meetupjs.com.ar/calendario.html'
const HODOR_HEADER = 'Hodor hodor hodor hodor hodor hodor :simple_smile:\n\n'
const MORNING_HEADER = 'Estos son los eventos de hoy :simple_smile:\n\n'
const ZONE = 'America/Buenos_Aires'

function getRandomBot() {
    const bots = require(process.env.BOTS_PATH).bots
    const mixedBots = shuffle(bots.slice(0))

    return mixedBots[0]
}

function run() {
    // por la mañana
    new CronJob(
        '00 30 08 * * *',
        () => {
            // obtiene el bot que va a publicar aleatoriamente
            const randomBot = getRandomBot()
            // genera un mensaje custom según la hora del día (mañana o tarde)
            // y el bot que publica
            const messageTemplateBuilder = message =>
                randomBot.name.toUpperCase() === 'HODOR'
                    ? `${HODOR_HEADER}${message}${HODOR_FOOTER}`
                    : `${MORNING_HEADER}${message}${FOOTER}`
            // fecha para filtrar eventos (puede ser el mismo día o el día siguiente)
            const deadline = moment(new Date(), ZONE)

            sendSlackMessage(deadline, messageTemplateBuilder, randomBot)
        },
        null,
        true,
        ZONE
    )

    // por la tarde
    new CronJob(
        '00 30 17 * * *',
        () => {
            // obtiene el bot que va a publicar aleatoriamente
            const randomBot = getRandomBot()
            // genera un mensaje custom según la hora del día (mañana o tarde)
            // y el bot que publica
            const messageTemplateBuilder = message =>
                randomBot.name.toUpperCase() === 'HODOR'
                    ? `${HODOR_HEADER}${message}${HODOR_FOOTER}`
                    : `${AFTERNOON_HEADER}${message}${FOOTER}`
            // fecha para filtrar eventos (puede ser el mismo día o el día siguiente)
            const deadline = moment(new Date(), ZONE).add(1, 'days')

            sendSlackMessage(deadline, messageTemplateBuilder, randomBot)
        },
        null,
        true,
        ZONE
    )
}

function sendSlackMessage(deadline, messageTemplateBuilder, randomBot) {
    // llamamos al API para pedir los eventos
    return (
        got(process.env.CALENDAR_API_URL)
            // obtengo el body
            .then(res => res.body)
            // parseo los resultados
            .then(JSON.parse)
            // selecciono el primer elemento del calendario que corresponde al mes del deadline
            .then(calendars =>
                calendars.filter(
                    calendar =>
                        calendar.when.month == deadline.format('MMMM') &&
                        calendar.when.year == deadline.format('YYYY')
                )
            )
            // descarto los eventos que no pertenecen al día de hoy
            .then(([currentMonthCalendar]) => {
                return currentMonthCalendar.events.filter(event => {
                    const eventDate = moment.tz(new Date(event.date), ZONE)

                    return eventDate.isSame(deadline, 'days')
                })
            })
            // Verifico que haya eventos para mostrar
            .then(eventsOfTheDay => {
                if (!eventsOfTheDay.length) {
                    return Promise.reject(
                        `Hoy no hay eventos: ${moment.tz(new Date(), ZONE).format()}`
                    )
                }

                return eventsOfTheDay
            })
            // construyo un string con la información que quiero mostrar
            .then(eventsOfTheDay => {
                let eventsMessage = ''

                eventsOfTheDay.forEach(event => {
                    const eventDate = moment.tz(new Date(event.date), ZONE).utc()

                    eventsMessage =
                        eventsMessage +
                        `*${event.eventName}*\n>` +
                        (event.place ? ` _${event.place}_, ` : '') +
                        `${eventDate.format('HH:mm')} hs.` +
                        `\n> ${event.eventLink}\n\n`
                })

                return eventsMessage
            })
            // agrego un header y un footer
            .then(messageTemplateBuilder)
            // envío el mensaje a Slack
            .then(message => {
                const messageOptions = {
                    channel: process.env.CHANNEL,
                    icon_emoji: randomBot.avatar,
                    text: message,
                    username: randomBot.name
                }
                const slack = new Slack()

                slack.setWebhook(process.env.SLACK_WEBHOOK_URL)
                slack.webhook(messageOptions, (error, response) => {
                    if (error) {
                        // eslint-disable-next-line
                        return console.error(error)
                    }

                    // eslint-disable-next-line
                    return console.log(response)
                })
            })
            // en caso de error, solo lo muestro por la consola
            // eslint-disable-next-line
            .catch(error => console.error(error))
    )
}

module.exports = {
    run
}

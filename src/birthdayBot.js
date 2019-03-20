require('isomorphic-fetch')
const CronJob = require('cron').CronJob
const moment = require('moment-timezone')
const Slack = require('slack-node')
const gsheets = require('gsheets')

moment.locale('es')

// constantes
const BIRTHDAY_FOOTER =
    'Para agregar un saludito usá este formulario https://docs.google.com/forms/d/e/1FAIpQLSdV9nHG84MxpvM9ewHoIUpnCHspGqcoSealCrq8ajqsAhAhWQ/viewform'
const BIRTHDAY_HEADER = ':tada: Hoy es el cumpleaños de: :tada:\n\n'
const ZONE = 'America/Buenos_Aires'

function run() {
    //10 am
    new CronJob(
        '00 00 10 * * *',
        () => {
            // mensaje a publicar
            const messageTemplateBuilder = message => `${BIRTHDAY_HEADER}${message}${BIRTHDAY_FOOTER}`
            // fecha para filtrar cumpleaños del dia
            const deadline = moment(new Date(), ZONE)

            sendSlackMessage(deadline, messageTemplateBuilder)
        },
        null,
        true,
        ZONE
    )
}

function sendSlackMessage(deadline, messageTemplateBuilder) {
    return (        
        // Se obtienen los cumpleaños desde un spreadsheet
        gsheets
            .getWorksheet(
                process.env.BIRTHDAYS_SPREADSHEET_ID,
                process.env.BIRTHDAYS_WORKSHEET_ID
            )
            .then(response => response.data)
            // se filtran los cumpleaños del dia de hoy
            .then(birthdays => birthdays.filter(
                birthday => deadline.format('DD/MM') === moment(birthday['Fecha'], 'DD/MM').format('DD/MM')
            ))
            // si hay alguno, se formatea el mensaje
            .then(birthdaysOfTheDay => {
                if (!birthdaysOfTheDay.length) {
                    return Promise.reject('No hay cumpleaños el dia de hoy. :(')
                }
                return birthdaysOfTheDay.reduce((message, birthday) => {
                    const id = birthday['ID de Usuario de Slack']
                    return (
                        message +
                        `> *${birthday['Nombre']}* ${id ? `- <@${id}>` : ''}\n\n`
                    )
                }, '')
            })
            .then(messageTemplateBuilder)
            .then(message => {
                const messageOptions = {
                    channel: process.env.CHANNEL,
                    // party emoji
                    icon_emoji: 'http://meetupjs-slack-bot.now.sh/assets/happy-isna.jpg',
                    text: message,
                    username: 'Cumpleaños de la comunidad !'
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
            // eslint-disable-next-line
            .catch(error => console.log(error))
    )
}

module.exports = {
    run
}

require('isomorphic-fetch')
const CronJob = require('cron').CronJob
const moment = require('moment-timezone')
const Slack = require('slack-node')
const gsheets = require('gsheets')

moment.locale('es')

// constantes
const BIRTHDAY_FOOTER =
    'Para agregar un saludito usá este formulario https://docs.google.com/forms/d/e/1FAIpQLSdV9nHG84MxpvM9ewHoIUpnCHspGqcoSealCrq8ajqsAhAhWQ/viewform'
const BIRTHDAY_HEADER = ':tada: :tada: :tada: Hoy es el cumpleaños de:\n\n'
const ZONE = 'America/Buenos_Aires'
const ID = 'ID de Usuario de Slack'
const NAME = 'Nombre'

function run() {
    //10 am
    new CronJob(
        '00 00 10 * * *',
        () => {
            // mensaje a publicar
            const messageTemplateBuilder = message => `${BIRTHDAY_HEADER}${message}\n`
            // fecha para filtrar cumpleaños del dia
            const deadline = moment(new Date(), ZONE)

            sendSlackMessage(deadline, messageTemplateBuilder)
        },
        null,
        true,
        ZONE
    )
}

function getUniqueElementsBy(arr, fn) {
    return (
        arr.reduce((acc, v) => {
            let index = acc.findIndex(x => fn(v, x))
            if (index < 0) {
                acc.push(v)
            } else {
                acc.splice(index, 1, v)
            }
            return acc
        }, [])
    )
}

function sendSlackMessage(deadline, messageTemplateBuilder) {
    return (
        // Se obtienen los cumpleaños desde un spreadsheet
        gsheets
            .getWorksheet(process.env.BIRTHDAYS_SPREADSHEET_ID, process.env.BIRTHDAYS_WORKSHEET_ID)
            .then(response => response.data)
            // se filtran los cumpleaños del dia de hoy
            .then(birthdays =>
                birthdays.filter(
                    birthday =>
                        deadline.format('DD/MM') ===
                        moment(birthday['Fecha'], 'DD/MM').format('DD/MM')
                )
            )
            // si no hay cumpleaños, se corta el proceso.
            // si hay, se intentan eliminar los duplicados            
            .then(birthdaysOfTheDay => {
                if (!birthdaysOfTheDay.length) {
                    return Promise.reject('No hay cumpleaños el dia de hoy. :(')
                }
                return birthdaysOfTheDay
            })
            .then(birthdaysOfTheDay => 
                getUniqueElementsBy(
                    birthdaysOfTheDay,
                    (a, b) => a[ID] && a[ID] === b[ID]
                )
            )
            .then(birthdaysOfTheDay => 
                getUniqueElementsBy(
                    birthdaysOfTheDay,
                    (a, b) => a[NAME] === b[NAME]
                )
            )
            // se formatea el mensaje
            .then(birthdaysOfTheDay =>
                birthdaysOfTheDay.reduce((message, birthday) => {
                    const id = birthday[ID]
                    return message + `> *${birthday[NAME]}* ${id ? `- <@${id}>` : ''}\n`
                }, '')
            )
            .then(messageTemplateBuilder)
            .then(message => {
                const messageOptions = {
                    channel: process.env.CHANNEL,
                    // party emoji
                    icon_emoji: 'http://meetupjs-slack-bot.now.sh/assets/happy-isna.jpg',
                    text: message,
                    username: '¡Cumpleaños.js!',
                    attachments: [
                        {
                            fallback: 'Happy Birthday!',
                            image_url: 'http://meetupjs-slack-bot.now.sh/assets/birthday.gif',
                            color: '#ffe45e'
                        },
                        {
                            pretext: BIRTHDAY_FOOTER
                        }
                    ]
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

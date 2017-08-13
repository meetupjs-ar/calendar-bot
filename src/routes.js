const bot = require('./bot');
const fs = require('fs');
const path = require('path');
const { send } = require('micro');

function avatar(req, res) {
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

function index(req, res) {
    send(res, 200, { active: true });
}

function info(req, res) {
    send(res, 200, { instance: process.env.INSTANCE_NAME });
}

function notfound(req, res) {
    send(res, 404, 'Not found');
}

module.exports = {
    avatar,
    index,
    info,
    notfound
};

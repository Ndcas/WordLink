const nodemailer = require('nodemailer');

let appEmail = process.env.APP_EMAIL;
let appEmailPassword = process.env.APP_EMAIL_PASSWORD;

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: appEmail,
        pass: appEmailPassword
    }
});

async function sendEmail(to, subject, html) {
    try {
        await transporter.sendMail({
            from: appEmail,
            to: to,
            subject: subject,
            html: html
        });

    } catch (error) {
        console.error('Cannot send email', error);
    }
}

module.exports = sendEmail;
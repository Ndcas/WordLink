const nodemailer = require('nodemailer');

const appEmail = process.env.APP_EMAIL;
const appEmailPassword = process.env.APP_EMAIL_PASSWORD;

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
            from: `WordLink <${appEmail}>`,
            to: to,
            subject: subject,
            html: html
        });

    } catch (error) {
        throw error;
    }
}

module.exports = sendEmail;
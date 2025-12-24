"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMail = sendMail;
const nodemailer_1 = __importDefault(require("nodemailer"));
function getBool(v, def = false) {
    if (typeof v === 'boolean')
        return v;
    if (typeof v === 'string')
        return v.toLowerCase() === 'true';
    return def;
}
async function sendMail(opts) {
    const useSmtp = String(process.env.MAIL_USE_SMTP || '').toLowerCase() === 'true';
    const host = process.env.SMTP_HOST;
    const portStr = process.env.SMTP_PORT;
    const secureStr = process.env.SMTP_SECURE;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    let transporter;
    let fromAddress = '';
    if (!useSmtp) {
        const testAcc = await nodemailer_1.default.createTestAccount();
        transporter = nodemailer_1.default.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: { user: testAcc.user, pass: testAcc.pass },
        });
        fromAddress = `${process.env.MERCHANT_NAME || 'ITWale Notes'} <${testAcc.user}>`;
    }
    else {
        const looksPlaceholder = !host || !portStr || !user || !pass || /example\.com$/i.test(String(host)) || /@example\.com$/i.test(String(user)) || String(pass).toLowerCase() === 'password';
        if (looksPlaceholder) {
            console.warn('MAIL_USE_SMTP=true but SMTP env looks placeholder; falling back to Ethereal test account');
            const testAcc = await nodemailer_1.default.createTestAccount();
            transporter = nodemailer_1.default.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: { user: testAcc.user, pass: testAcc.pass },
            });
            fromAddress = `${process.env.MERCHANT_NAME || 'ITWale Notes'} <${testAcc.user}>`;
        }
        else {
            const port = parseInt(String(portStr), 10) || 587;
            const secure = getBool(secureStr, false);
            transporter = nodemailer_1.default.createTransport({ host, port, secure, auth: { user, pass } });
            const fromName = process.env.MERCHANT_NAME || 'ITWale Notes';
            fromAddress = `${fromName} <${user}>`;
        }
    }
    try {
        const info = await transporter.sendMail({ from: fromAddress, to: opts.to, subject: opts.subject, text: opts.text, html: opts.html });
        const previewUrl = nodemailer_1.default.getTestMessageUrl(info) || undefined;
        if (previewUrl)
            console.log('Email preview URL:', previewUrl);
        return { messageId: info.messageId, previewUrl };
    }
    catch (e) {
        console.error('sendMail error', e);
    }
}

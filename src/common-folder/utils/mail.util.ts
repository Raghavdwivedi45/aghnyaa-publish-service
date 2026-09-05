import { createTransport, type Transporter } from "nodemailer";

let transporter: Transporter | undefined;

// Built lazily (on first use), NOT at import time.
// Detailed explanation in README -> "Mailer: why the transporter is built lazily".
export function getTransporter(): Transporter {
    if (!transporter) {
        transporter = createTransport({
            host: process.env.MAIL_HOST,
            port: Number(process.env.MAIL_PORT),
            secure: false,
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS
            }
        });
    }
    return transporter;
}

export async function sendEmail(
    to: string,
    subject: string,
    html: string,
    text?: string
) {
    return getTransporter().sendMail({
        from: process.env.MAIL_USER,
        to,
        subject,
        html,
        text,
    });
}

'use server';

import nodemailer from 'nodemailer';
import { schoolConfig } from '@/lib/config';
import { getEmailTemplate } from '@/lib/email-helper';

interface DataExportEmailData {
    to: string;
    name: string;
    data: string; // JSON string
}

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, 
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const sanitize = (str: string) => (str ? str.replace(/<[^>]*>?/gm, '') : '');

export async function sendDataExportEmail(params: DataExportEmailData) {
    const { to, name, data } = params;
    
    let htmlContent = getEmailTemplate('user-data-export');
    htmlContent = htmlContent.replace(/{{name}}/g, sanitize(name))
                             .replace(/{{schoolName}}/g, sanitize(schoolConfig.name))
                             .replace(/{{year}}/g, new Date().getFullYear().toString());

    const mailOptions = {
        from: `"${schoolConfig.name}" <${process.env.FROM_EMAIL}>`,
        to,
        subject: `Your Personal Data Export from ${schoolConfig.name}`,
        html: htmlContent,
        attachments: [
            {
                filename: 'your-data.json',
                content: data,
                contentType: 'application/json',
            },
        ],
    };

    await transporter.sendMail(mailOptions);
}

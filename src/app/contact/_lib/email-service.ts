
'use server';

import nodemailer from 'nodemailer';
import { schoolConfig } from '@/lib/config';
import { getEmailTemplate } from '@/lib/email-helper';

// Define the shape of the form data
interface ContactData {
    name: string;
    email: string;
    message: string;
}

interface EmailParams {
    data: ContactData;
    file: File | null;
}

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const sanitize = (str: string) => (str ? str.replace(/<[^>]*>?/gm, '') : '');

export async function sendAdminEmail({ data, file }: EmailParams) {
    const { name, email, message } = data;
    
    const attachments = [];
    if (file) {
        const buffer = Buffer.from(await file.arrayBuffer());
        attachments.push({
            filename: file.name,
            content: buffer,
            contentType: file.type,
        });
    }
    
    let htmlContent = getEmailTemplate('contact-admin-notification');
    htmlContent = htmlContent.replace(/{{name}}/g, sanitize(name))
                             .replace(/{{email}}/g, sanitize(email))
                             .replace(/{{message}}/g, sanitize(message).replace(/\n/g, '<br>'));

    const mailToAdminOptions = {
        from: `"${schoolConfig.name}" <${process.env.FROM_EMAIL}>`,
        to: process.env.TO_EMAIL,
        replyTo: sanitize(email),
        subject: `New Website Message from ${sanitize(name)}`,
        html: htmlContent,
        attachments,
    };

    await transporter.sendMail(mailToAdminOptions);
}


export async function sendConfirmationEmail({ data, file }: EmailParams) {
    const { name, email, message } = data;
    
    const attachmentInfoHtml = file ? `<p style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #eeeeee;"><strong>Attachment:</strong> ${sanitize(file.name)}</p>` : '';
    
    let htmlContent = getEmailTemplate('contact-user-confirmation');
    htmlContent = htmlContent.replace(/{{name}}/g, sanitize(name))
                             .replace(/{{message}}/g, sanitize(message).replace(/\n/g, '<br>'))
                             .replace(/{{attachmentInfo}}/g, attachmentInfoHtml)
                             .replace(/{{schoolName}}/g, sanitize(schoolConfig.name))
                             .replace(/{{year}}/g, new Date().getFullYear().toString());


    const mailToUserOptions = {
      from: `"${schoolConfig.name}" <${process.env.FROM_EMAIL}>`,
      to: sanitize(email),
      subject: 'We have received your message!',
      html: htmlContent,
    };

    await transporter.sendMail(mailToUserOptions);
}

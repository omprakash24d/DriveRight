
'use server';

import nodemailer from 'nodemailer';
import { schoolConfig } from '@/lib/config';
import { getEmailTemplate } from '@/lib/email-helper';

interface CertificateEmailData {
    to: string;
    studentName: string;
    course: string;
    certNumber: string;
    certificateUrl: string;
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

export async function sendCertificateNotificationEmail(data: CertificateEmailData) {
    const { to, studentName, course, certNumber, certificateUrl } = data;
    
    let htmlContent = getEmailTemplate('certificate-notification');

    htmlContent = htmlContent.replace(/{{studentName}}/g, sanitize(studentName))
                             .replace(/{{course}}/g, sanitize(course))
                             .replace(/{{certNumber}}/g, sanitize(certNumber))
                             .replace(/{{certificateUrl}}/g, certificateUrl)
                             .replace(/{{schoolName}}/g, sanitize(schoolConfig.name))
                             .replace(/{{year}}/g, new Date().getFullYear().toString());


    const mailOptions = {
        from: `"${schoolConfig.name}" <${process.env.FROM_EMAIL}>`,
        to: to,
        subject: `Your Driving Certificate is Ready!`,
        html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
}

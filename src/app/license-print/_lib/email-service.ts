
'use server';

import nodemailer from 'nodemailer';
import { schoolConfig } from '@/lib/config';
import { format } from 'date-fns';
import type { LicensePrintInquiryStatus } from '@/services/licensePrintInquiriesService';
import { getEmailTemplate } from '@/lib/email-helper';

interface LicensePrintData {
    name: string;
    email: string;
    dlNumber: string;
    dob: Date;
}

interface StatusUpdateData {
    to: string;
    name: string;
    status: LicensePrintInquiryStatus;
    notes?: string;
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

export async function sendLicensePrintAdminEmail(data: LicensePrintData) {
    const { name, email, dlNumber, dob } = data;
    
    let htmlContent = getEmailTemplate('license-print-admin-notification');
    htmlContent = htmlContent.replace(/{{name}}/g, sanitize(name))
                             .replace(/{{email}}/g, sanitize(email))
                             .replace(/{{dlNumber}}/g, sanitize(dlNumber))
                             .replace(/{{dob}}/g, format(dob, "PPP"));

    const mailToAdminOptions = {
        from: `"${schoolConfig.name}" <${process.env.FROM_EMAIL}>`,
        to: process.env.TO_EMAIL,
        replyTo: email,
        subject: `New DL Print Request from ${sanitize(name)}`,
        html: htmlContent,
    };

    await transporter.sendMail(mailToAdminOptions);
}

export async function sendLicensePrintStatusUpdateEmail({ to, name, status, notes }: StatusUpdateData) {
    const isProcessed = status === 'Processed';
    const subject = isProcessed ? "Your Driving License Document is Ready" : "Update on Your Driving License Request";
    const headerTitle = isProcessed ? "Document Sent!" : "Request Update";
    const headerColor = isProcessed ? '#2E8B57' : '#DC143C';
    const message = isProcessed
        ? "We have processed your request for a driving license print. The document should be attached to this email. Please check your attachments."
        : "We couldn't find your license with the details provided. Please see the notes below for more information and double-check your submission.";

    let htmlContent = getEmailTemplate('license-print-status-update');
    htmlContent = htmlContent.replace(/{{headerColor}}/g, headerColor)
                             .replace(/{{headerTitle}}/g, headerTitle)
                             .replace(/{{name}}/g, sanitize(name))
                             .replace(/{{message}}/g, message)
                             .replace(/{{notes}}/g, sanitize(notes || "No additional comments from the administrator.").replace(/\n/g, '<br>'))
                             .replace(/{{schoolName}}/g, sanitize(schoolConfig.name));


    const mailOptions = {
        from: `"${schoolConfig.name}" <${process.env.FROM_EMAIL}>`,
        to,
        subject,
        html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
}

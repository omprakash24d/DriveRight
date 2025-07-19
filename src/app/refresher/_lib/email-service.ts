
'use server';

import nodemailer from 'nodemailer';
import { schoolConfig } from '@/lib/config';
import { format } from 'date-fns';
import type { RefresherRequestStatus } from '@/services/refresherRequestsService';
import { getEmailTemplate } from '@/lib/email-helper';

interface RefresherData {
    name: string;
    email: string;
    mobileNo: string;
    dob: Date;
    vehicleType: 'lmv' | 'hmv';
    reason: string;
}

interface AdminEmailParams {
    data: RefresherData;
    refId: string;
    file: File;
}

interface UserEmailParams {
    data: Pick<RefresherData, 'name' | 'email'>;
    refId: string;
}

interface RefresherStatusUpdateData {
    to: string;
    name: string;
    status: RefresherRequestStatus;
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

export async function sendRefresherAdminEmail({ data, refId, file }: AdminEmailParams) {
    const { name, email, mobileNo, dob, vehicleType, reason } = data;

    const attachments = [
        {
            filename: `License_${sanitize(name)}_${file.name}`,
            content: Buffer.from(await file.arrayBuffer()),
            contentType: file.type,
        },
    ];

    let htmlContent = getEmailTemplate('refresher-admin-notification');
    htmlContent = htmlContent.replace(/{{refId}}/g, sanitize(refId))
                             .replace(/{{name}}/g, sanitize(name))
                             .replace(/{{email}}/g, sanitize(email))
                             .replace(/{{mobileNo}}/g, sanitize(mobileNo))
                             .replace(/{{dob}}/g, format(dob, "PPP"))
                             .replace(/{{vehicleType}}/g, sanitize(vehicleType.toUpperCase()))
                             .replace(/{{reason}}/g, sanitize(reason))
                             .replace(/{{schoolName}}/g, sanitize(schoolConfig.name));


    const mailToAdminOptions = {
        from: `"${schoolConfig.name}" <${process.env.FROM_EMAIL}>`,
        to: process.env.TO_EMAIL,
        replyTo: email,
        subject: `New Refresher Course Request: ${sanitize(name)} (Ref: ${refId})`,
        html: htmlContent,
        attachments,
    };

    await transporter.sendMail(mailToAdminOptions);
}


export async function sendRefresherConfirmationEmail({ data, refId }: UserEmailParams) {
    const { name, email } = data;

    let htmlContent = getEmailTemplate('refresher-user-confirmation');
    htmlContent = htmlContent.replace(/{{name}}/g, sanitize(name))
                             .replace(/{{refId}}/g, sanitize(refId))
                             .replace(/{{schoolName}}/g, sanitize(schoolConfig.name))
                             .replace(/{{year}}/g, new Date().getFullYear().toString());

    const mailToUserOptions = {
        from: `"${schoolConfig.name}" <${process.env.FROM_EMAIL}>`,
        to: email,
        subject: `Your Refresher Course Request is Received! (Ref: ${refId})`,
        html: htmlContent,
    };

    await transporter.sendMail(mailToUserOptions);
}

export async function sendRefresherStatusUpdateEmail({ to, name, status, notes }: RefresherStatusUpdateData) {
    const isApproved = status === 'Approved';
    const subject = isApproved ? "Your Refresher Course Request is Approved!" : "Update on Your Refresher Course Request";
    const headerTitle = isApproved ? "Request Approved!" : "Request Update";
    const headerColor = isApproved ? '#2E8B57' : '#DC143C';
    const message = isApproved
        ? "We are pleased to inform you that your request for a refresher course has been approved! We will contact you shortly on your registered mobile number to schedule your session."
        : "We have reviewed your request for a refresher course. Please see the notes below for more details regarding the status.";

    let htmlContent = getEmailTemplate('refresher-status-update');
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

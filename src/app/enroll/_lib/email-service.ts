
'use server';

import { schoolConfig } from '@/lib/config';
import { getEmailTemplate } from '@/lib/email-helper';
import { format } from 'date-fns';
import nodemailer from 'nodemailer';

interface EnrollmentData {
    fullName: string;
    email: string;
    mobileNumber: string;
    dateOfBirth: Date;
    address: string;
    state: string;
    vehicleType: string;
    photoCroppedUrl: string; // Now a URL
}

interface AdminEmailParams {
    data: EnrollmentData;
    refId: string;
    idProofFile: File;
}

interface UserEmailParams {
    data: Pick<EnrollmentData, 'fullName' | 'email'>;
    refId: string;
}

function checkEmailConfig() {
    const requiredEnvVars = ['SMTP_USER', 'SMTP_PASS', 'FROM_EMAIL', 'TO_EMAIL'];
    const missingEnvVars = requiredEnvVars.filter(v => !process.env[v]);

    if (missingEnvVars.length > 0) {
        throw new Error(`Email service is not configured. Missing environment variables: ${missingEnvVars.join(', ')}`);
    }
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

export async function sendEnrollmentAdminEmail({ data, refId, idProofFile }: AdminEmailParams) {
    checkEmailConfig();
    const { fullName, email, mobileNumber, dateOfBirth, address, state, vehicleType, photoCroppedUrl } = data;

    // Convert URL path to actual file system path for local files
    let photoAttachment;
    if (photoCroppedUrl.startsWith('/uploads/')) {
        // Local file - convert URL to file system path
        const { join } = await import('path');
        const localPath = join(process.cwd(), 'public', photoCroppedUrl.replace('/', ''));
        photoAttachment = {
            filename: `Photo_Cropped_${sanitize(fullName)}.jpg`,
            path: localPath,
            contentType: 'image/jpeg',
        };
    } else {
        // Firebase Storage URL - use URL directly
        photoAttachment = {
            filename: `Photo_Cropped_${sanitize(fullName)}.jpg`,
            path: photoCroppedUrl,
            contentType: 'image/jpeg',
        };
    }

    const attachments = [
        {
            filename: `IDProof_${sanitize(fullName)}_${idProofFile.name}`,
            content: Buffer.from(await idProofFile.arrayBuffer()),
            contentType: idProofFile.type,
        },
        photoAttachment
    ];
    
    let htmlContent = getEmailTemplate('enrollment-admin-notification');
    htmlContent = htmlContent.replace(/{{refId}}/g, sanitize(refId))
                             .replace(/{{fullName}}/g, sanitize(fullName))
                             .replace(/{{email}}/g, sanitize(email))
                             .replace(/{{mobileNumber}}/g, sanitize(mobileNumber))
                             .replace(/{{dateOfBirth}}/g, format(dateOfBirth, "PPP"))
                             .replace(/{{address}}/g, sanitize(address))
                             .replace(/{{state}}/g, sanitize(state))
                             .replace(/{{vehicleType}}/g, sanitize(vehicleType.toUpperCase()))
                             .replace(/{{schoolName}}/g, sanitize(schoolConfig.name));

    const mailToAdminOptions = {
        from: `"${schoolConfig.name}" <${process.env.FROM_EMAIL}>`,
        to: process.env.TO_EMAIL,
        replyTo: email,
        subject: `New Enrollment Application: ${sanitize(fullName)} (Ref: ${refId})`,
        html: htmlContent,
        attachments,
    };

    await transporter.sendMail(mailToAdminOptions);
}

export async function sendEnrollmentConfirmationEmail({ data, refId }: UserEmailParams) {
    checkEmailConfig();
    const { fullName, email } = data;

    let htmlContent = getEmailTemplate('enrollment-user-confirmation');
    htmlContent = htmlContent.replace(/{{fullName}}/g, sanitize(fullName))
                             .replace(/{{refId}}/g, sanitize(refId))
                             .replace(/{{schoolName}}/g, sanitize(schoolConfig.name))
                             .replace(/{{year}}/g, new Date().getFullYear().toString());

    const mailToUserOptions = {
        from: `"${schoolConfig.name}" <${process.env.FROM_EMAIL}>`,
        to: email,
        subject: `Your Enrollment Application is Received! (Ref: ${refId})`,
        html: htmlContent,
    };

    await transporter.sendMail(mailToUserOptions);
}

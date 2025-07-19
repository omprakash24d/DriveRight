
'use server';

import nodemailer from 'nodemailer';
import { schoolConfig } from '@/lib/config';
import { format } from 'date-fns';
import type { LlInquiryStatus } from '@/services/llInquiriesService';
import { getEmailTemplate } from '@/lib/email-helper';

interface LlInquiryData {
    name: string;
    applicationNo: string;
    dob: Date;
    mobileNo: string;
    email: string; // Added for admin notification
}

interface LlStatusUpdateData {
    to: string;
    name: string;
    status: LlInquiryStatus;
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

export async function sendLlInquiryAdminEmail(data: LlInquiryData) {
    const { name, applicationNo, dob, mobileNo, email } = data;

    let htmlContent = getEmailTemplate('ll-inquiry-admin-notification');
    htmlContent = htmlContent.replace(/{{name}}/g, sanitize(name))
                             .replace(/{{email}}/g, sanitize(email))
                             .replace(/{{applicationNo}}/g, sanitize(applicationNo))
                             .replace(/{{dob}}/g, format(dob, "PPP"))
                             .replace(/{{mobileNo}}/g, sanitize(mobileNo))
                             .replace(/{{schoolName}}/g, sanitize(schoolConfig.name));

    const mailToAdminOptions = {
        from: `"${schoolConfig.name}" <${process.env.FROM_EMAIL}>`,
        to: process.env.TO_EMAIL,
        replyTo: email,
        subject: `New LL Exam Result Inquiry from ${sanitize(name)}`,
        html: htmlContent,
    };

    await transporter.sendMail(mailToAdminOptions);
}

export async function sendLlStatusUpdateEmail({ to, name, status, notes }: LlStatusUpdateData) {
    const isApproved = status === 'Approved';
    const subject = isApproved ? "Congratulations! Your LL Exam Result is 'Pass'" : "Update on Your LL Exam Result";
    const headerTitle = isApproved ? "Result: Pass!" : "Result Update";
    const headerColor = isApproved ? '#2E8B57' : '#DC143C';
    const message = isApproved
        ? "We are pleased to inform you that you have PASSED your Learner's License test. Congratulations!"
        : "After checking your application, we found the result status to be DECLINED or PENDING. Please see the notes below for more details.";

    let htmlContent = getEmailTemplate('ll-inquiry-status-update');
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

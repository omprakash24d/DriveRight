
export const template = `
<!DOCTYPE html>
<html>
<head>
    <style>
    body { font-family: Arial, sans-serif; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
    .header { background-color: #1E90FF; color: #ffffff; padding: 20px; text-align: center; border-top-left-radius: 8px; border-top-right-radius: 8px; }
    .content { padding: 30px; line-height: 1.6; }
    .footer { background-color: #eeeeee; color: #777777; padding: 15px; text-align: center; font-size: 12px; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px; }
    </style>
</head>
<body>
    <div class="container">
    <div class="header"><h1>Your Data Export</h1></div>
    <div class="content">
        <h2>Hi {{name}},</h2>
        <p>As requested, we have attached an export of your personal data from {{schoolName}}.</p>
        <p>The attached file, <strong>your-data.json</strong>, contains the information we have on file for your account in a machine-readable format.</p>
        <p>If you did not request this export, please contact our support team immediately.</p>
        <p>Best regards,<br/>The {{schoolName}} Team</p>
    </div>
    <div class="footer">
        <p>&copy; {{year}} {{schoolName}}. All rights reserved.</p>
        <p>This is an automated message. Please do not reply directly to this email.</p>
    </div>
    </div>
</body>
</html>
`;

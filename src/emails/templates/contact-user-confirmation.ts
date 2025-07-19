
export const template = `
<!DOCTYPE html>
<html>
<head>
    <style>
    body { font-family: Arial, sans-serif; background-color: #F0F8FF; margin: 0; padding: 0; -webkit-font-smoothing: antialiased;}
    .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.1); border: 1px solid #e0e0e0; }
    .header { background-color: #3498DB; color: #ffffff; padding: 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 30px; line-height: 1.6; color: #333333; }
    .content h2 { color: #3498DB; font-size: 20px; }
    .message-box { background-color: #F0F8FF; border-left: 4px solid #3498DB; padding: 15px; margin: 20px 0; word-wrap: break-word; }
    .message-box p { margin: 0; white-space: pre-wrap; }
    .footer { background-color: #eeeeee; color: #777777; padding: 15px; text-align: center; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
    <div class="header"><h1>Thank You!</h1></div>
    <div class="content">
        <h2>Hi {{name}},</h2>
        <p>Thank you for reaching out. We have received your message and will get back to you as soon as possible.</p>
        <p>For your reference, here is a copy of your submission:</p>
        <div class="message-box">
        <p>{{message}}</p>
        {{attachmentInfo}}
        </div>
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

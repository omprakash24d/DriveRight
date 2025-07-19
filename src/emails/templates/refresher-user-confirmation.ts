
export const template = `
<!DOCTYPE html>
<html>
<head>
    <style>
    body { font-family: Arial, sans-serif; background-color: #F0FFF0; }
    .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
    .header { background-color: #4682B4; color: #ffffff; padding: 20px; text-align: center; border-top-left-radius: 8px; border-top-right-radius: 8px; }
    .content { padding: 30px; line-height: 1.6; }
    .content h2 { color: #4682B4; }
    .ref-box { background-color: #F0FFF0; border: 2px dashed #4682B4; padding: 15px; margin: 20px 0; text-align: center; }
    .ref-box p { margin: 0; }
    .footer { background-color: #eeeeee; color: #777777; padding: 15px; text-align: center; font-size: 12px; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px; }
    </style>
</head>
<body>
    <div class="container">
    <div class="header"><h1>Request Received!</h1></div>
    <div class="content">
        <h2>Hi {{name}},</h2>
        <p>Thank you for your interest in a refresher course with {{schoolName}}! We have successfully received your request.</p>
        <p>Our team will review your details and contact you shortly to discuss your needs and schedule a session. Please keep your reference number handy.</p>
        <div class="ref-box">
        <p>Your Reference Number:</p>
        <p style="font-size: 20px; font-weight: bold; color: #4682B4; margin-top: 5px;">{{refId}}</p>
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

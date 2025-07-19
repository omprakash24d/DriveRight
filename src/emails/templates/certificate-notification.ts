
export const template = `
<!DOCTYPE html>
<html>
<head>
    <style>
    body { font-family: Arial, sans-serif; background-color: #f0f8ff; }
    .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
    .header { background-color: #3498DB; color: #ffffff; padding: 25px; text-align: center; border-top-left-radius: 8px; border-top-right-radius: 8px; }
    .header h1 { margin: 0; font-size: 26px; }
    .content { padding: 30px; line-height: 1.6; color: #333; }
    .content h2 { color: #3498DB; }
    .cta-button { display: inline-block; background-color: #2ECC71; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 20px; text-align: center; }
    .details-box { background-color: #f9f9f9; border: 1px solid #e0e0e0; padding: 15px; margin: 20px 0; border-radius: 5px; }
    .details-box p { margin: 8px 0; }
    .footer { background-color: #eeeeee; color: #777777; padding: 15px; text-align: center; font-size: 12px; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px; }
    </style>
</head>
<body>
    <div class="container">
    <div class="header"><h1>Congratulations, {{studentName}}!</h1></div>
    <div class="content">
        <h2>Your certificate is ready.</h2>
        <p>We are thrilled to announce that you have successfully completed your course and your official certificate is now available.</p>
        <div class="details-box">
        <p><strong>Course:</strong> {{course}}</p>
        <p><strong>Certificate No:</strong> {{certNumber}}</p>
        </div>
        <p>You can view and download your certificate by clicking the button below:</p>
        <a href="{{certificateUrl}}" class="cta-button">View & Download Certificate</a>
        <p style="margin-top: 25px;">Well done on your achievement!</p>
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

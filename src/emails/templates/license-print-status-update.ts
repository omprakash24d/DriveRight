
export const template = `
<!DOCTYPE html>
<html>
<head>
    <style>
    body { font-family: Arial, sans-serif; }
    .container { max-width: 600px; margin: 20px auto; }
    .header { color: #ffffff; padding: 20px; text-align: center; }
    .content { padding: 30px; line-height: 1.6; }
    .notes-box { background-color: #f9f9f9; border-left: 4px solid #cccccc; padding: 15px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
    <div class="header" style="background-color: {{headerColor}};"><h1>{{headerTitle}}</h1></div>
    <div class="content">
        <h2 style="color: {{headerColor}};">Hi {{name}},</h2>
        <p>This is an update regarding your driving license print request.</p>
        <p><strong>{{message}}</strong></p>
        <div class="notes-box">
        <p><strong>Administrator Notes:</strong></p>
        <p>{{notes}}</p>
        </div>
        <p>If you have any questions, please contact us.</p>
        <p>Best regards,<br/>The {{schoolName}} Team</p>
    </div>
    </div>
</body>
</html>
`;


export const template = `
<!DOCTYPE html>
<html>
<head>
    <style>
    body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
    .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.1); border: 1px solid #e0e0e0; }
    .header { background-color: #3498DB; color: #ffffff; padding: 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 30px; line-height: 1.6; color: #333333; }
    .content h2 { color: #3498DB; font-size: 20px; }
    .message-box { background-color: #f9f9f9; border-left: 4px solid #4ECDC4; padding: 15px; margin: 20px 0; }
    .details p { margin: 5px 0; font-size: 16px; }
    .cta-button { display: inline-block; background-color: #3498DB; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 20px; text-align: center; }
    .footer { background-color: #eeeeee; color: #777777; padding: 15px; text-align: center; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
    <div class="header"><h1>New Message!</h1></div>
    <div class="content">
        <h2>You've received a new message.</h2>
        <div class="details">
        <p><strong>From:</strong> {{name}}</p>
        <p><strong>Email:</strong> <a href="mailto:{{email}}" style="color: #3498DB;">{{email}}</a></p>
        </div>
        <h3>Message:</h3>
        <div class="message-box"><p>{{message}}</p></div>
        <a href="mailto:{{email}}" class="cta-button">Respond to {{name}}</a>
    </div>
    <div class="footer"><p>This email was sent from your website's contact form.</p></div>
    </div>
</body>
</html>
`;

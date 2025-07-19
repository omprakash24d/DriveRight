
export const template = `
<!DOCTYPE html>
<html>
<head>
    <style>
    body { font-family: Arial, sans-serif; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
    .header { background-color: #FFA500; color: #ffffff; padding: 20px; text-align: center; border-top-left-radius: 8px; border-top-right-radius: 8px; }
    .content { padding: 30px; line-height: 1.6; }
    .content h2 { color: #FFA500; }
    .details { background-color: #f9f9f9; border-left: 4px solid #4682B4; padding: 15px; margin: 20px 0; }
    .details p { margin: 5px 0; }
    .footer { background-color: #eeeeee; color: #777777; padding: 15px; text-align: center; font-size: 12px; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px; }
    </style>
</head>
<body>
    <div class="container">
    <div class="header"><h1>LL Exam Result Inquiry</h1></div>
    <div class="content">
        <h2>A user has submitted an inquiry to check their LL Exam Result.</h2>
        <div class="details">
        <p><strong>Name:</strong> {{name}}</p>
        <p><strong>Email:</strong> {{email}}</p>
        <p><strong>Application No.:</strong> {{applicationNo}}</p>
        <p><strong>Date of Birth:</strong> {{dob}}</p>
        <p><strong>Mobile No.:</strong> {{mobileNo}}</p>
        </div>
        <p>Please check the result on the official portal and update the status in the admin panel.</p>
    </div>
    <div class="footer"><p>Sent from the {{schoolName}} website.</p></div>
    </div>
</body>
</html>
`;

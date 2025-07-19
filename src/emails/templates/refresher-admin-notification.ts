
export const template = `
<!DOCTYPE html>
<html>
<head>
    <style>
    body { font-family: Arial, sans-serif; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
    .header { background-color: #4682B4; color: #ffffff; padding: 20px; text-align: center; border-top-left-radius: 8px; border-top-right-radius: 8px; }
    .content { padding: 30px; line-height: 1.6; }
    .content h2 { color: #4682B4; }
    .details { background-color: #f9f9f9; border-left: 4px solid #2E8B57; padding: 15px; margin: 20px 0; }
    .details p { margin: 5px 0; }
    .footer { background-color: #eeeeee; color: #777777; padding: 15px; text-align: center; font-size: 12px; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px; }
    </style>
</head>
<body>
    <div class="container">
    <div class="header"><h1>New Refresher Request</h1></div>
    <div class="content">
        <h2>A new refresher course request has been submitted.</h2>
        <div class="details">
        <p><strong>Reference ID:</strong> {{refId}}</p>
        <p><strong>Full Name:</strong> {{name}}</p>
        <p><strong>Email:</strong> {{email}}</p>
        <p><strong>Mobile:</strong> {{mobileNo}}</p>
        <p><strong>Date of Birth:</strong> {{dob}}</p>
        <p><strong>Vehicle Type:</strong> {{vehicleType}}</p>
        <p><strong>Reason for Request:</strong></p>
        <p>{{reason}}</p>
        </div>
        <p>The applicant's previous driving license is attached to this email.</p>
    </div>
    <div class="footer"><p>Sent from the {{schoolName}} website refresher request form.</p></div>
    </div>
</body>
</html>
`;


export const template = `
<!DOCTYPE html>
<html>
<head>
    <style>
    body { font-family: Arial, sans-serif; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
    .header { background-color: #2E8B57; color: #ffffff; padding: 20px; text-align: center; border-top-left-radius: 8px; border-top-right-radius: 8px; }
    .content { padding: 30px; line-height: 1.6; }
    .content h2 { color: #2E8B57; }
    .details { background-color: #f9f9f9; border-left: 4px solid #4682B4; padding: 15px; margin: 20px 0; }
    .details p { margin: 5px 0; }
    .cta-button { display: inline-block; background-color: #3498DB; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 10px; }
    .footer { background-color: #eeeeee; color: #777777; padding: 15px; text-align: center; font-size: 12px; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px; }
    </style>
</head>
<body>
    <div class="container">
    <div class="header"><h1>New Enrollment Application</h1></div>
    <div class="content">
        <h2>A new enrollment application has been submitted.</h2>
        <div class="details">
        <p><strong>Reference ID:</strong> {{refId}}</p>
        <p><strong>Full Name:</strong> {{fullName}}</p>
        <p><strong>Email:</strong> {{email}}</p>
        <p><strong>Mobile:</strong> {{mobileNumber}}</p>
        <p><strong>Date of Birth:</strong> {{dateOfBirth}}</p>
        <p><strong>Address:</strong> {{address}}, {{state}}</p>
        <p><strong>Course:</strong> {{vehicleType}}</p>
        </div>
        <h3>Applicant's documents are attached to this email.</h3>
    </div>
    <div class="footer"><p>Sent from the {{schoolName}} website enrollment form.</p></div>
    </div>
</body>
</html>
`;

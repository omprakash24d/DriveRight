import nodemailer from 'nodemailer';

interface BookingConfirmationData {
  to: string;
  customerName: string;
  bookingId: string;
  serviceName: string;
  serviceType: 'training' | 'online';
  amount: number;
  currency: string;
  bookingDate: Date;
  scheduledDate?: Date;
  paymentStatus: 'pending' | 'paid' | 'failed';
  razorpayOrderId: string;
}

interface PaymentConfirmationData {
  to: string;
  customerName: string;
  bookingId: string;
  transactionId: string;
  serviceName: string;
  serviceType: 'training' | 'online';
  amount: number;
  currency: string;
  paymentDate: Date;
  paymentMethod: string;
  razorpayPaymentId: string;
  receipt?: string;
}

interface PaymentFailureData {
  to: string;
  customerName: string;
  bookingId: string;
  serviceName: string;
  failureReason: string;
  retryLink: string;
}

interface ServiceReminderData {
  to: string;
  customerName: string;
  serviceName: string;
  scheduledDate: Date;
  location?: string;
  instructions?: string;
}

export class EmailService {
  private static transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: parseInt(process.env.SMTP_PORT || '587') === 465, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false // Accept self-signed certificates
    },
    connectionTimeout: 60000, // 60 seconds
    greetingTimeout: 30000, // 30 seconds
    socketTimeout: 60000, // 60 seconds
  });

  // Booking confirmation email
  static async sendBookingConfirmation(data: BookingConfirmationData): Promise<boolean> {
    try {
      const { to, customerName, bookingId, serviceName, serviceType, amount, currency, bookingDate, scheduledDate, paymentStatus, razorpayOrderId } = data;

      const subject = `Booking Confirmation - ${serviceName} | DriveRight Driving School`;
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Booking Confirmation</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #3B82F6; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .booking-details { background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .amount { font-size: 24px; font-weight: bold; color: #059669; }
            .status { padding: 5px 10px; border-radius: 3px; font-weight: bold; }
            .status.pending { background-color: #FEF3C7; color: #92400E; }
            .status.paid { background-color: #D1FAE5; color: #065F46; }
            .footer { text-align: center; padding: 20px; color: #666; }
            .button { background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Booking Confirmation</h1>
              <p>DriveRight Driving School</p>
            </div>
            
            <div class="content">
              <h2>Hello ${customerName},</h2>
              <p>Thank you for booking with DriveRight Driving School! Your booking has been confirmed.</p>
              
              <div class="booking-details">
                <h3>Booking Details</h3>
                <p><strong>Booking ID:</strong> ${bookingId}</p>
                <p><strong>Service:</strong> ${serviceName}</p>
                <p><strong>Service Type:</strong> ${serviceType.charAt(0).toUpperCase() + serviceType.slice(1)}</p>
                <p><strong>Booking Date:</strong> ${bookingDate.toLocaleDateString()}</p>
                ${scheduledDate ? `<p><strong>Scheduled Date:</strong> ${scheduledDate.toLocaleDateString()}</p>` : ''}
                <p><strong>Amount:</strong> <span class="amount">${currency} ${amount}</span></p>
                <p><strong>Payment Status:</strong> <span class="status ${paymentStatus}">${paymentStatus.toUpperCase()}</span></p>
                <p><strong>Payment Order ID:</strong> ${razorpayOrderId}</p>
              </div>

              ${paymentStatus === 'pending' ? `
                <p>Your payment is currently pending. Please complete the payment to confirm your booking.</p>
                <a href="${process.env.NEXT_PUBLIC_BASE_URL}/payment/complete?orderId=${razorpayOrderId}" class="button">Complete Payment</a>
              ` : ''}

              <div class="booking-details">
                <h3>What's Next?</h3>
                <ul>
                  ${serviceType === 'training' ? `
                    <li>You will receive a call from our team within 24 hours to schedule your training session.</li>
                    <li>Please bring the required documents as mentioned in the course details.</li>
                    <li>Arrive 15 minutes early for your scheduled session.</li>
                  ` : `
                    <li>Your request will be processed within the mentioned timeframe.</li>
                    <li>You will receive updates via email and SMS.</li>
                    <li>Documents will be delivered as per the chosen delivery method.</li>
                  `}
                  <li>For any queries, contact us at ${process.env.CONTACT_EMAIL || 'info@driveright.com'}</li>
                </ul>
              </div>

              <p>Thank you for choosing DriveRight Driving School. We're committed to providing you with the best driving education experience.</p>
            </div>
            
            <div class="footer">
              <p>DriveRight Driving School<br>
              Email: ${process.env.CONTACT_EMAIL || 'info@driveright.com'}<br>
              Phone: ${process.env.CONTACT_PHONE || '+91-XXXXXXXXXX'}<br>
              Website: ${process.env.NEXT_PUBLIC_BASE_URL}</p>
            </div>
          </div>
        </body>
        </html>
      `;

      await this.transporter.sendMail({
        from: `"DriveRight Driving School" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html: htmlContent,
      });

      return true;
    } catch (error) {
      return false;
    }
  }

  // Payment confirmation email
  static async sendPaymentConfirmation(data: PaymentConfirmationData): Promise<boolean> {
    try {
      const { to, customerName, bookingId, transactionId, serviceName, serviceType, amount, currency, paymentDate, paymentMethod, razorpayPaymentId } = data;

      const subject = `Payment Confirmation - ${serviceName} | DriveRight Driving School`;
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Payment Confirmation</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #059669; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .payment-details { background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .amount { font-size: 24px; font-weight: bold; color: #059669; }
            .success-badge { background-color: #10B981; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; display: inline-block; }
            .footer { text-align: center; padding: 20px; color: #666; }
            .receipt-box { border: 2px dashed #ccc; padding: 15px; margin: 15px 0; background-color: #fafafa; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Payment Successful!</h1>
              <p>DriveRight Driving School</p>
            </div>
            
            <div class="content">
              <h2>Hello ${customerName},</h2>
              <p>Great news! Your payment has been successfully processed. Your booking is now confirmed.</p>
              
              <div class="payment-details">
                <h3>Payment Details</h3>
                <p><span class="success-badge">PAID</span></p>
                <p><strong>Transaction ID:</strong> ${transactionId}</p>
                <p><strong>Booking ID:</strong> ${bookingId}</p>
                <p><strong>Service:</strong> ${serviceName}</p>
                <p><strong>Amount Paid:</strong> <span class="amount">${currency} ${amount}</span></p>
                <p><strong>Payment Date:</strong> ${paymentDate.toLocaleDateString()} ${paymentDate.toLocaleTimeString()}</p>
                <p><strong>Payment Method:</strong> ${paymentMethod}</p>
                <p><strong>Payment ID:</strong> ${razorpayPaymentId}</p>
              </div>

              <div class="receipt-box">
                <h3>📄 Receipt</h3>
                <p>This email serves as your payment receipt. Please save this for your records.</p>
                <p><strong>Receipt No:</strong> ${bookingId}-${transactionId.slice(-6)}</p>
              </div>

              <div class="payment-details">
                <h3>Next Steps</h3>
                <ul>
                  ${serviceType === 'training' ? `
                    <li>Our team will contact you within 24 hours to schedule your training.</li>
                    <li>Please keep your documents ready as per the course requirements.</li>
                    <li>You can track your booking status in your dashboard.</li>
                  ` : `
                    <li>Your service request is now being processed.</li>
                    <li>You will receive status updates via email and SMS.</li>
                    <li>Expected completion as per service delivery timeline.</li>
                  `}
                </ul>
              </div>

              <p>If you have any questions or need assistance, please don't hesitate to contact us.</p>
            </div>
            
            <div class="footer">
              <p>DriveRight Driving School<br>
              Email: ${process.env.CONTACT_EMAIL || 'info@driveright.com'}<br>
              Phone: ${process.env.CONTACT_PHONE || '+91-XXXXXXXXXX'}<br>
              Website: ${process.env.NEXT_PUBLIC_BASE_URL}</p>
            </div>
          </div>
        </body>
        </html>
      `;

      await this.transporter.sendMail({
        from: `"DriveRight Driving School" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html: htmlContent,
      });

      return true;
    } catch (error) {
      return false;
    }
  }

  // Payment failure notification
  static async sendPaymentFailure(data: PaymentFailureData): Promise<boolean> {
    try {
      const { to, customerName, bookingId, serviceName, failureReason, retryLink } = data;

      const subject = `Payment Failed - ${serviceName} | DriveRight Driving School`;
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Payment Failed</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #EF4444; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .failure-details { background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #EF4444; }
            .retry-button { background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
            .footer { text-align: center; padding: 20px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Payment Failed</h1>
              <p>DriveRight Driving School</p>
            </div>
            
            <div class="content">
              <h2>Hello ${customerName},</h2>
              <p>Unfortunately, your payment for the booking could not be processed.</p>
              
              <div class="failure-details">
                <h3>Payment Details</h3>
                <p><strong>Booking ID:</strong> ${bookingId}</p>
                <p><strong>Service:</strong> ${serviceName}</p>
                <p><strong>Failure Reason:</strong> ${failureReason}</p>
              </div>

              <p>Don't worry! Your booking is still reserved. You can retry the payment using the link below:</p>
              
              <a href="${retryLink}" class="retry-button">Retry Payment</a>

              <div class="failure-details">
                <h3>Common Payment Issues</h3>
                <ul>
                  <li>Insufficient balance in your account</li>
                  <li>Incorrect card details or expired card</li>
                  <li>Bank network issues or temporary downtime</li>
                  <li>Daily transaction limit exceeded</li>
                </ul>
              </div>

              <p>If you continue to face issues, please contact our support team for assistance.</p>
            </div>
            
            <div class="footer">
              <p>DriveRight Driving School<br>
              Email: ${process.env.CONTACT_EMAIL || 'info@driveright.com'}<br>
              Phone: ${process.env.CONTACT_PHONE || '+91-XXXXXXXXXX'}<br>
              Website: ${process.env.NEXT_PUBLIC_BASE_URL}</p>
            </div>
          </div>
        </body>
        </html>
      `;

      await this.transporter.sendMail({
        from: `"DriveRight Driving School" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html: htmlContent,
      });

      return true;
    } catch (error) {
      return false;
    }
  }

  // Service reminder email (for training services)
  static async sendServiceReminder(data: ServiceReminderData): Promise<boolean> {
    try {
      const { to, customerName, serviceName, scheduledDate, location, instructions } = data;

      const subject = `Reminder: ${serviceName} Tomorrow | DriveRight Driving School`;
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Service Reminder</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #F59E0B; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .reminder-details { background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .time-highlight { font-size: 20px; font-weight: bold; color: #F59E0B; }
            .footer { text-align: center; padding: 20px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔔 Service Reminder</h1>
              <p>DriveRight Driving School</p>
            </div>
            
            <div class="content">
              <h2>Hello ${customerName},</h2>
              <p>This is a friendly reminder about your upcoming training session.</p>
              
              <div class="reminder-details">
                <h3>Service Details</h3>
                <p><strong>Service:</strong> ${serviceName}</p>
                <p><strong>Date & Time:</strong> <span class="time-highlight">${scheduledDate.toLocaleDateString()} at ${scheduledDate.toLocaleTimeString()}</span></p>
                ${location ? `<p><strong>Location:</strong> ${location}</p>` : ''}
              </div>

              ${instructions ? `
                <div class="reminder-details">
                  <h3>Important Instructions</h3>
                  <p>${instructions}</p>
                </div>
              ` : ''}

              <div class="reminder-details">
                <h3>Things to Remember</h3>
                <ul>
                  <li>Arrive 15 minutes before your scheduled time</li>
                  <li>Bring all required documents</li>
                  <li>Wear comfortable clothes and closed-toe shoes</li>
                  <li>Bring a valid ID proof</li>
                  <li>If you need to reschedule, contact us at least 2 hours in advance</li>
                </ul>
              </div>

              <p>We look forward to seeing you tomorrow. If you have any questions, please don't hesitate to contact us.</p>
            </div>
            
            <div class="footer">
              <p>DriveRight Driving School<br>
              Email: ${process.env.CONTACT_EMAIL || 'info@driveright.com'}<br>
              Phone: ${process.env.CONTACT_PHONE || '+91-XXXXXXXXXX'}<br>
              Website: ${process.env.NEXT_PUBLIC_BASE_URL}</p>
            </div>
          </div>
        </body>
        </html>
      `;

      await this.transporter.sendMail({
        from: `"DriveRight Driving School" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html: htmlContent,
      });

      return true;
    } catch (error) {
      return false;
    }
  }
}

import nodemailer from 'nodemailer';

/**
 * Creates and returns a configured email transporter
 * This is a singleton function that returns the same transporter instance
 * @returns {nodemailer.Transporter} Configured nodemailer transporter
 */
let cachedTransporter = null;

export function getEmailTransporter() {
  if (cachedTransporter) {
    return cachedTransporter;
  }
  
  // Create a new transporter if one doesn't exist
  cachedTransporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      // Do not fail on invalid certs
      rejectUnauthorized: false
    }
  });
  
  return cachedTransporter;
}
 

/**
 * Email template types
 * @enum {string}
 */
export const EmailTemplate = {
  OTP: 'otp',
  ORDER_CONFIRMATION: 'order_confirmation',
  FEEDBACK: 'feedback',
  THANK_YOU: 'thank_you',
  TEST: 'test'
};

/**
 * Generate HTML for email templates
 * @param {string} template - Template type from EmailTemplate enum
 * @param {Object} data - Data to populate the template
 * @returns {string} - HTML content for the email
 */

function generateEmailHTML(template, data) {
  const currentYear = new Date().getFullYear();
  
  switch (template) {
    case EmailTemplate.OTP: {
      const { otp, orderItems, totalAmount, currency = '¥' } = data;
      
      // Format order items for email
      const itemsList = orderItems.map(item => 
        `<li>${item.name} x ${item.quantity} - ${currency}${(item.price * item.quantity).toFixed(2)}</li>`
      ).join('');
      
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #d32f2f; margin: 0;">Hotel-POS</h1>
            <p style="color: #666; font-size: 14px;">Order Verification</p>
          </div>
          
          <div style="background-color: #f8f8f8; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <h2 style="margin-top: 0; color: #333;">Your Verification Code</h2>
            <p style="font-size: 24px; font-weight: bold; letter-spacing: 5px; text-align: center; margin: 20px 0; color: #d32f2f;">${otp}</p>
            <p style="margin-bottom: 0; color: #666;">Please enter this code to complete your order. This code will expire in 10 minutes.</p>
          </div>
          
          <div style="margin-bottom: 20px;">
            <h3 style="color: #333;">Order Summary</h3>
            <ul style="padding-left: 20px;">
              ${itemsList}
            </ul>
            <p style="font-weight: bold; text-align: right;">Total: ${currency}${totalAmount.toFixed(2)}</p>
          </div>
          
          <div style="font-size: 12px; color: #999; text-align: center; margin-top: 30px; padding-top: 15px; border-top: 1px solid #e0e0e0;">
            <p>This is an automated message, please do not reply to this email.</p>
            <p>&copy; ${currentYear} Hotel-POS. All rights reserved.</p>
          </div>
        </div>
      `;
    }
    
    case EmailTemplate.ORDER_CONFIRMATION: {
      const { orderItems, totalAmount, currency = '¥', orderId, orderDate = new Date() } = data;
      
      // Format order items for email
      const itemsList = orderItems.map(item => 
        `<tr>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${item.name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0; text-align: right;">${currency}${(item.price * item.quantity).toFixed(2)}</td>
        </tr>`
      ).join('');

      const formattedDate = new Date(orderDate).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #d32f2f; margin: 0;">Hotel-POS</h1>
            <p style="color: #666; font-size: 14px;">Order Confirmation</p>
          </div>
          
          <div style="background-color: #f8f8f8; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <h2 style="margin-top: 0; color: #333;">Thank You for Your Order!</h2>
            <p style="color: #666;">Your order has been confirmed and is being prepared.</p>
          </div>
          
          <div style="margin-bottom: 20px;">
            <h3 style="color: #333;">Order Details</h3>
            <p><strong>Order ID:</strong> ${orderId}</p>
            <p><strong>Date:</strong> ${formattedDate}</p>
            
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
              <thead>
                <tr style="background-color: #f0f0f0;">
                  <th style="padding: 8px; text-align: left;">Item</th>
                  <th style="padding: 8px; text-align: center;">Qty</th>
                  <th style="padding: 8px; text-align: right;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsList}
                <tr>
                  <td colspan="2" style="padding: 8px; text-align: right; font-weight: bold;">Total:</td>
                  <td style="padding: 8px; text-align: right; font-weight: bold;">${currency}${totalAmount.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div style="margin-bottom: 20px; padding: 15px; background-color: #f8f8f8; border-radius: 5px;">
            <h3 style="color: #333; margin-top: 0;">Need Help?</h3>
            <p style="margin-bottom: 0;">If you have any questions about your order, please contact our customer service.</p>
          </div>
          
          <div style="font-size: 12px; color: #999; text-align: center; margin-top: 30px; padding-top: 15px; border-top: 1px solid #e0e0e0;">
            <p>Thank you for choosing Hotel-POS.</p>
            <p>&copy; ${currentYear} Hotel-POS. All rights reserved.</p>
          </div>
        </div>
      `;
    }
    
case EmailTemplate.FEEDBACK: {
      const { food, service, staff, money, cleanliness, suggestion, email: customerEmail } = data;

      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #d32f2f; margin: 0;">Hotel-POS</h1>
            <p style="color: #666; font-size: 14px;">New Customer Feedback Received</p>
          </div>

          <div style="background-color: #f8f8f8; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="margin-top: 0; color: #333;">Feedback Details</h2>

            <table style="width: 100%; border-collapse: collapse;">
              <tr style="background-color: #fff;">
                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Customer Email:</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${customerEmail || 'Anonymous'}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Food Quality:</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${food || 'N/A'}</td>
              </tr>
              <tr style="background-color: #fff;">
                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Service Quality:</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${service || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Staff Behavior:</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${staff || 'N/A'}</td>
              </tr>
              <tr style="background-color: #fff;">
                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Value for Money:</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${money || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Cleanliness:</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${cleanliness || 'N/A'}</td>
              </tr>
            </table>

            ${suggestion ? `
              <div style="margin-top: 20px;">
                <h3 style="color: #333; margin-bottom: 8px;">Customer Suggestion:</h3>
                <p style="background-color: #fff; padding: 12px; border-radius: 6px; border: 1px solid #eee; white-space: pre-wrap;">
                  ${suggestion}
                </p>
              </div>
            ` : ''}
          </div>

          <div style="font-size: 12px; color: #999; text-align: center; margin-top: 30px; padding-top: 15px; border-top: 1px solid #e0e0e0;">
            <p>This is an automated message from customer feedback form.</p>
            <p>© ${currentYear} Hotel-POS. All rights reserved.</p>
          </div>
        </div>
      `;
    }

    // 2. Add case to generateEmailHTML (around line 240)
case EmailTemplate.THANK_YOU: {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #d32f2f; margin: 0;">Hotel-POS</h1>
      </div>
      <div style="padding: 20px; text-align: center;">
        <h2 style="color: #333;">Thank You for Your Feedback!</h2>
        <p style="color: #666; font-size: 16px; line-height: 1.5;">
          We truly appreciate you taking the time to share your experience with us. 
          Your feedback helps us improve our service and provide a better experience for all our guests.
        </p>
        <div style="margin-top: 30px; padding: 20px; background-color: #f9f9f9; border-radius: 8px;">
          <p style="margin: 0; color: #888; font-style: italic;">"Quality is not an act, it is a habit."</p>
        </div>
      </div>
      <div style="font-size: 12px; color: #999; text-align: center; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">
        <p>&copy; ${new Date().getFullYear()} Hotel-POS. All rights reserved.</p>
      </div>
    </div>
  `;
}

    case EmailTemplate.TEST: {
      const { message = "This is a test email to verify that the email system is working correctly." } = data;
      
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #d32f2f; margin: 0;">Hotel-POS</h1>
            <p style="color: #666; font-size: 14px;">Test Email</p>
          </div>
          
          <div style="background-color: #f8f8f8; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <h2 style="margin-top: 0; color: #333;">Email System Test</h2>
            <p style="margin-bottom: 0; color: #666;">${message}</p>
          </div>
          
          <div style="font-size: 12px; color: #999; text-align: center; margin-top: 30px; padding-top: 15px; border-top: 1px solid #e0e0e0;">
            <p>This is an automated message, please do not reply to this email.</p>
            <p>&copy; ${currentYear} Hotel-POS. All rights reserved.</p>
          </div>
        </div>
      `;
    }
    
    default:
      throw new Error(`Unknown email template: ${template}`);
  }
}

/**
 * Send an email using the specified template
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} template - Template type from EmailTemplate enum
 * @param {Object} data - Data to populate the template
 * @returns {Promise<Object>} - Resolves with the email sending result
 */
// export async function sendEmail(from,to, subject, template, data, bcc = null) {
//   try {
//     const transporter = getEmailTransporter();
//     const html = generateEmailHTML(template, data);
    
//     // const mailOptions = {
//     //   from: process.env.EMAIL || from ,   // Customer email or fallback to your email
//     //   to: toAddresses,
//     //   subject,
//     //   html,
//     //   replyTo: from || process.env.EMAIL  // Replies go to customer
//     // };
//      const mailOptions = {
//       // Formatting 'from' to show customer email name but send from your auth email (Gmail requirement)
//       from: from ? `"${from}" <${process.env.EMAIL}>` : process.env.EMAIL,
//       to: Array.isArray(to) ? to.join(', ') : to,
//       bcc: Array.isArray(bcc) ? bcc.join(', ') : bcc,
//       subject,
//       html,
//       replyTo: from || process.env.EMAIL
//     };
//     //  const mailOptions = {
//     //   // Formatting 'from' to show customer email name but send from your auth email (Gmail requirement)
//     //   from: from ? `"${from}" <${process.env.EMAIL}>` : process.env.EMAIL,
//     //   to: Array.isArray(to) ? to.join(', ') : to,
//     //   bcc: Array.isArray(bcc) ? bcc.join(', ') : bcc,
//     //   subject,
//     //   html,
//     //   replyTo: from || process.env.EMAIL
//     // };
//     const result = await transporter.sendMail(mailOptions);
//     // console.log(`Email sent successfully to ${to}`);
//     // console.log(`Feedback email sent from ${from} to ${toAddresses}`);
//     return result;
//   } catch (error) {
//     console.error(`Error sending ${template} email:`, error);
//     throw error;
//   }
// }


/**
 * Send an email (supports both positional and object calling styles)
 */
/**
 * Send email - supports BOTH positional (OTP/order) and object (feedback) styles
 */
export async function sendEmail(...args) {
  let from, to, subject, template, data, bcc;

  // Modern object style (used in feedback)
  if (args.length === 1 && typeof args[0] === 'object' && !Array.isArray(args[0])) {
    ({ from, to, subject, template, data, bcc } = args[0]);
  } 
  // Old positional style (OTP & order confirmation) - correct order
  else {
    // Positional: sendEmail(to, subject, template, data, from?, bcc?)
    [to, subject, template, data, from, bcc] = args;

    // If from was not passed, default to system email
    from = from || process.env.EMAIL;
  }

  try {
    const transporter = getEmailTransporter();

    const toAddresses = Array.isArray(to) ? to.join(', ') : to;
    const bccAddresses = Array.isArray(bcc) ? bcc.join(', ') : (bcc || null);

    const html = generateEmailHTML(template, data || {});

    const mailOptions = {
      from: from ? `"${from}" <${process.env.EMAIL}>` : process.env.EMAIL,
      to: toAddresses,
      bcc: bccAddresses,
      subject,
      html,
      replyTo: from || process.env.EMAIL
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${template} → ${toAddresses}`);
    return result;
  } catch (error) {
    console.error(`Error sending ${template || 'unknown'} email:`, error);
    throw error;
  }
}
/**
 * NEW: Send feedback notification to admins
 * @param {Object} feedbackData - Full feedback from form
 */
export async function sendFeedbackEmail(feedbackData) {
  const adminEmails = [
    "hitesh9398rao@gmail.com",           // Admin 1
    "another@domain.com"
  ];

  const customerEmail = feedbackData.email || "anonymous@feedback.com";

  return sendEmail({
    from: customerEmail,                        // ← Customer's email in From
    to: adminEmails,                            // ← Multiple admins in To
    subject: `New Feedback from ${customerEmail.split('@')[0]}`,
    template: EmailTemplate.FEEDBACK,
    data: feedbackData
  });
}

/**
 * Send an email with OTP for order verification
 * @param {string} to - Recipient email address
 * @param {string} otp - One-time password
 * @param {Object} orderDetails - Order details including items and total
 * @returns {Promise} - Resolves when email is sent
 */
export async function sendOTPEmail(to, otp, orderDetails) {
  return sendEmail(
    to,
    'Hotel-POS - Order Verification Code',
    EmailTemplate.OTP,
    {
      otp,
      ...orderDetails
    }
  );
}

/**
 * Send an order confirmation email
 * @param {string} to - Recipient email address
 * @param {Object} orderDetails - Order details including items, total, and order ID
 * @returns {Promise} - Resolves when email is sent
 */
export async function sendOrderConfirmationEmail(to, orderDetails) {
  return sendEmail(
    to,
    'Hotel-POS - Order Confirmation',
    EmailTemplate.ORDER_CONFIRMATION,
    orderDetails
  );
}


// import nodemailer from 'nodemailer';

// /**
//  * Creates and returns a configured email transporter
//  * This is a singleton function that returns the same transporter instance
//  * @returns {nodemailer.Transporter} Configured nodemailer transporter
//  */
// let cachedTransporter = null;

// export function getEmailTransporter() {
//   if (cachedTransporter) {
//     return cachedTransporter;
//   }
  
//   // Create a new transporter if one doesn't exist
//   cachedTransporter = nodemailer.createTransport({
//     service: 'gmail',
//     host: 'smtp.gmail.com',
//     port: 465,
//     secure: true,
//     auth: {
//       user: process.env.EMAIL,
//       pass: process.env.EMAIL_PASS,
//     },
//     tls: {
//       // Do not fail on invalid certs
//       rejectUnauthorized: false
//     }
//   });
  
//   return cachedTransporter;
// }
 

// /**
//  * Email template types
//  * @enum {string}
//  */
// export const EmailTemplate = {
//   OTP: 'otp',
//   ORDER_CONFIRMATION: 'order_confirmation',
//   TEST: 'test'
// };

// /**
//  * Generate HTML for email templates
//  * @param {string} template - Template type from EmailTemplate enum
//  * @param {Object} data - Data to populate the template
//  * @returns {string} - HTML content for the email
//  */

// function generateEmailHTML(template, data) {
//   const currentYear = new Date().getFullYear();
  
//   switch (template) {
//     case EmailTemplate.OTP: {
//       const { otp, orderItems, totalAmount, currency = '¥' } = data;
      
//       // Format order items for email
//       const itemsList = orderItems.map(item => 
//         `<li>${item.name} x ${item.quantity} - ${currency}${(item.price * item.quantity).toFixed(2)}</li>`
//       ).join('');
      
//       return `
//         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
//           <div style="text-align: center; margin-bottom: 20px;">
//             <h1 style="color: #d32f2f; margin: 0;">Hotel-POS</h1>
//             <p style="color: #666; font-size: 14px;">Order Verification</p>
//           </div>
          
//           <div style="background-color: #f8f8f8; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
//             <h2 style="margin-top: 0; color: #333;">Your Verification Code</h2>
//             <p style="font-size: 24px; font-weight: bold; letter-spacing: 5px; text-align: center; margin: 20px 0; color: #d32f2f;">${otp}</p>
//             <p style="margin-bottom: 0; color: #666;">Please enter this code to complete your order. This code will expire in 10 minutes.</p>
//           </div>
          
//           <div style="margin-bottom: 20px;">
//             <h3 style="color: #333;">Order Summary</h3>
//             <ul style="padding-left: 20px;">
//               ${itemsList}
//             </ul>
//             <p style="font-weight: bold; text-align: right;">Total: ${currency}${totalAmount.toFixed(2)}</p>
//           </div>
          
//           <div style="font-size: 12px; color: #999; text-align: center; margin-top: 30px; padding-top: 15px; border-top: 1px solid #e0e0e0;">
//             <p>This is an automated message, please do not reply to this email.</p>
//             <p>&copy; ${currentYear} Hotel-POS. All rights reserved.</p>
//           </div>
//         </div>
//       `;
//     }
    
//     case EmailTemplate.ORDER_CONFIRMATION: {
//       const { orderItems, totalAmount, currency = '¥', orderId, orderDate = new Date() } = data;
      
//       // Format order items for email
//       const itemsList = orderItems.map(item => 
//         `<tr>
//           <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${item.name}</td>
//           <td style="padding: 8px; border-bottom: 1px solid #e0e0e0; text-align: center;">${item.quantity}</td>
//           <td style="padding: 8px; border-bottom: 1px solid #e0e0e0; text-align: right;">${currency}${(item.price * item.quantity).toFixed(2)}</td>
//         </tr>`
//       ).join('');

//       const formattedDate = new Date(orderDate).toLocaleString('en-US', {
//         year: 'numeric',
//         month: 'long',
//         day: 'numeric',
//         hour: '2-digit',
//         minute: '2-digit'
//       });
      
//       return `
//         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
//           <div style="text-align: center; margin-bottom: 20px;">
//             <h1 style="color: #d32f2f; margin: 0;">Hotel-POS</h1>
//             <p style="color: #666; font-size: 14px;">Order Confirmation</p>
//           </div>
          
//           <div style="background-color: #f8f8f8; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
//             <h2 style="margin-top: 0; color: #333;">Thank You for Your Order!</h2>
//             <p style="color: #666;">Your order has been confirmed and is being prepared.</p>
//           </div>
          
//           <div style="margin-bottom: 20px;">
//             <h3 style="color: #333;">Order Details</h3>
//             <p><strong>Order ID:</strong> ${orderId}</p>
//             <p><strong>Date:</strong> ${formattedDate}</p>
            
//             <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
//               <thead>
//                 <tr style="background-color: #f0f0f0;">
//                   <th style="padding: 8px; text-align: left;">Item</th>
//                   <th style="padding: 8px; text-align: center;">Qty</th>
//                   <th style="padding: 8px; text-align: right;">Price</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 ${itemsList}
//                 <tr>
//                   <td colspan="2" style="padding: 8px; text-align: right; font-weight: bold;">Total:</td>
//                   <td style="padding: 8px; text-align: right; font-weight: bold;">${currency}${totalAmount.toFixed(2)}</td>
//                 </tr>
//               </tbody>
//             </table>
//           </div>
          
//           <div style="margin-bottom: 20px; padding: 15px; background-color: #f8f8f8; border-radius: 5px;">
//             <h3 style="color: #333; margin-top: 0;">Need Help?</h3>
//             <p style="margin-bottom: 0;">If you have any questions about your order, please contact our customer service.</p>
//           </div>
          
//           <div style="font-size: 12px; color: #999; text-align: center; margin-top: 30px; padding-top: 15px; border-top: 1px solid #e0e0e0;">
//             <p>Thank you for choosing Hotel-POS.</p>
//             <p>&copy; ${currentYear} Hotel-POS. All rights reserved.</p>
//           </div>
//         </div>
//       `;
//     }
    
//     case EmailTemplate.TEST: {
//       const { message = "This is a test email to verify that the email system is working correctly." } = data;
      
//       return `
//         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
//           <div style="text-align: center; margin-bottom: 20px;">
//             <h1 style="color: #d32f2f; margin: 0;">Hotel-POS</h1>
//             <p style="color: #666; font-size: 14px;">Test Email</p>
//           </div>
          
//           <div style="background-color: #f8f8f8; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
//             <h2 style="margin-top: 0; color: #333;">Email System Test</h2>
//             <p style="margin-bottom: 0; color: #666;">${message}</p>
//           </div>
          
//           <div style="font-size: 12px; color: #999; text-align: center; margin-top: 30px; padding-top: 15px; border-top: 1px solid #e0e0e0;">
//             <p>This is an automated message, please do not reply to this email.</p>
//             <p>&copy; ${currentYear} Hotel-POS. All rights reserved.</p>
//           </div>
//         </div>
//       `;
//     }
    
//     default:
//       throw new Error(`Unknown email template: ${template}`);
//   }
// }

// /**
//  * Send an email using the specified template
//  * @param {string} to - Recipient email address
//  * @param {string} subject - Email subject
//  * @param {string} template - Template type from EmailTemplate enum
//  * @param {Object} data - Data to populate the template
//  * @returns {Promise<Object>} - Resolves with the email sending result
//  */
// export async function sendEmail(to, subject, template, data) {
//   try {
//     const transporter = getEmailTransporter();
//     const html = generateEmailHTML(template, data);
    
//     const mailOptions = {
//       from: process.env.EMAIL,
//       to,
//       subject,
//       html
//     };
    
//     const result = await transporter.sendMail(mailOptions);
//     // console.log(`Email sent successfully to ${to}`);
//     return result;
//   } catch (error) {
//     console.error(`Error sending ${template} email:`, error);
//     throw error;
//   }
// }

// /**
//  * Send an email with OTP for order verification
//  * @param {string} to - Recipient email address
//  * @param {string} otp - One-time password
//  * @param {Object} orderDetails - Order details including items and total
//  * @returns {Promise} - Resolves when email is sent
//  */
// export async function sendOTPEmail(to, otp, orderDetails) {
//   return sendEmail(
//     to,
//     'Hotel-POS - Order Verification Code',
//     EmailTemplate.OTP,
//     {
//       otp,
//       ...orderDetails
//     }
//   );
// }

// /**
//  * Send an order confirmation email
//  * @param {string} to - Recipient email address
//  * @param {Object} orderDetails - Order details including items, total, and order ID
//  * @returns {Promise} - Resolves when email is sent
//  */
// export async function sendOrderConfirmationEmail(to, orderDetails) {
//   return sendEmail(
//     to,
//     'Hotel-POS - Order Confirmation',
//     EmailTemplate.ORDER_CONFIRMATION,
//     orderDetails
//   );
// }

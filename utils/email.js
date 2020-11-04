const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Abhijit Biswas <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'development') {
      // console.log('Email sending through Sendgrid');
      // Sendgrid
      return nodemailer.createTransport({
        service: 'SendGrid',
        // host: 'smtp.sendgrid.net',
        // port: 587,
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD
        }
      });
    }

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  // Send the actual mail
  async send(template, subject) {
    // 1) Render HTML based on a pug template
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject
    });

    // 2) Defime Email mailOptions
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.fromString(html)
      // html
    };

    // 3) Create a transporter and send email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Natours Family');
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token(Valid for only 10 minutes)'
    );
  }
};

// Previous configuration for email using Nodemailer
// const sendEmail = async options => {
//   // 1) Create a transporter
//   const transporter = nodemailer.createTransport({
//     host: process.env.EMAIL_HOST,
//     port: process.env.EMAIL_PORT,
//     auth: {
//       user: process.env.EMAIL_USERNAME,
//       pass: process.env.EMAIL_PASSWORD
//     }
//     // tls: {
//     //   rejectUnauthorized: false
//     // }
//     // Activate in Gmail "less secure app" option in case of Gmail account
//     // "Less secure app" option is not available to those Gmail accounts that has the 2 step verification enabled
//   });

//   // 2) Define the email options
//   const mailOptions = {
//     from: 'Abhijit Biswas <abhijit@gmail.com>',
//     to: options.email,
//     subject: options.subject,
//     text: options.message
//     //html
//   };

//   // 3) Actually send the email
//   await transporter.sendMail(mailOptions);
// };

// module.exports = sendEmail;

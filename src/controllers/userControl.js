const User = require('../models/userDetails');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const userStates = {}; // To track user progress during session

const handleUserMsg = async (socket, msg) => {
  const socketId = socket.id;

  let user = await User.findOne({ socketId: socketId });
  if (!user) {
    socket.emit('bot-message', '⚠️ Session expired or user not recognized. Please log in again.');
    return;
  }

  if (!userStates[socketId]) {
    userStates[socketId] = {
      introShown: false,
      stage: 'intro',
    };
  }

  const state = userStates[socketId];

  // Prevent message after resume is submitted
  if (state.stage === 'done' && msg !== '__init__') {
    socket.emit('bot-message', '✅ Your application has already been submitted. You will be updated via email. 📩');
    return;
  }

  // Handle greeting when user first lands on chatbot
  if (msg === '__init__') {
    const hour = new Date().getHours();
    let greet = '';

    if (hour < 12) greet = '🌞 Good Morning';
    else if (hour < 17) greet = '🌤 Good Afternoon';
    else greet = '🌙 Good Evening';

    socket.emit('bot-message', `${greet}, how can I assist you today? 😊`);
    state.introShown = false;
    state.stage = 'intro';
    return;
  }

  // STEP 1 - Intro
  if (state.stage === 'intro') {
    if (!state.introShown) {
      socket.emit('bot-message', '👋 Want to apply for a job?');
      socket.emit('bot-options', ['Yes', 'No']);
      state.introShown = true;
      return;
    }

    if (msg.toLowerCase() === 'yes') {
      state.stage = 'graduation';
      socket.emit('bot-message', '🎓 What is your graduation?');
      socket.emit('bot-options', ['B-tech', 'B.Sc', 'M-tech']);
      return;
    } else if (msg.toLowerCase() === 'no') {
      state.stage = 'done';
      socket.emit('bot-message', '👍 No worries! Have a great day!');
      return;
    } else {
      socket.emit('bot-message', 'Please choose Yes or No to continue.');
      socket.emit('bot-options', ['Yes', 'No']);
      return;
    }
  }

  // STEP 2 - Graduation
  else if (state.stage === 'graduation') {
    user.graduation = msg;
    await user.save();
    state.stage = 'domain';
    socket.emit('bot-message', '🧭 Choose your domain.');
    socket.emit('bot-options', ['Web-Development', 'AI/ML', 'Data-science', 'Cloud Computing', 'Quality-assessment']);
    return;
  }

  // STEP 3 - Domain
  else if (state.stage === 'domain') {
    user.domain = msg;
    await user.save();
    state.stage = 'skills';
    socket.emit('bot-message', '💡 Select your skills (comma-separated)');
    socket.emit('bot-options', ['HTML', 'CSS', 'JavaScript', 'node-js', 'express-js', 'mongoDB', 'ejs']);
    return;
  }

  // STEP 4 - Skills
  else if (state.stage === 'skills') {
    const knownSkills = ['HTML', 'CSS', 'JavaScript', 'node-js', 'express-js', 'mongoDB', 'ejs'];
    if (msg.includes(',') && knownSkills.some(skill => msg.includes(skill))) {
      user.skills = msg.split(',').map(skill => skill.trim());
      await user.save();
      state.stage = 'experience';
      socket.emit('bot-message', '💼 Do you have any prior experience?');
      socket.emit('bot-options', ['Yes', 'No']);
    } else {
      socket.emit('bot-message', '⚠️ Please enter at least one skill (comma-separated).');
      socket.emit('bot-options', knownSkills);
    }
    return;
  }

  // STEP 5 - Experience Yes/No
  else if (state.stage === 'experience') {
    if (msg.toLowerCase() === 'yes') {
      state.stage = 'experienceValue';
      socket.emit('bot-message', '⏳ How much experience do you have?');
      socket.emit('bot-options', ['< 2 years', '2 to 5 years', '> 5 years']);
    } else if (msg.toLowerCase() === 'no') {
      user.experience = 'No';
      await user.save();
      state.stage = 'package';
      socket.emit('bot-message', '💰 What is your expected package?');
      socket.emit('bot-options', ['2 LPA', '3 LPA', '4 LPA', '5 LPA', '6+ LPA']);
    } else {
      socket.emit('bot-message', 'Please choose Yes or No.');
      socket.emit('bot-options', ['Yes', 'No']);
    }
    return;
  }

  // STEP 6 - Experience Value
  else if (state.stage === 'experienceValue') {
    const valid = ['< 2 years', '2 to 5 years', '> 5 years'];
    if (valid.includes(msg.trim())) {
      user.experience = msg;
      await user.save();
      state.stage = 'package';
      socket.emit('bot-message', '💰 What is your expected package?');
      socket.emit('bot-options', ['2 LPA', '3 LPA', '4 LPA', '5 LPA', '6+ LPA']);
    } else {
      socket.emit('bot-message', '⚠️ Select one of the given experience options.');
      socket.emit('bot-options', valid);
    }
    return;
  }

  // STEP 7 - Package
  else if (state.stage === 'package') {
    user.expectedPackage = msg;
    await user.save();
    state.stage = 'resume';
    socket.emit('bot-message', '📎 Please upload your resume as a base64 PDF.');
    return;
  }

  // STEP 8 - Resume Upload
  else if (state.stage === 'resume') {
    if (msg.startsWith('data:application/pdf;base64,')) {
      const base64Data = msg.split(',')[1];
      const filePath = path.join(__dirname, `../uploads/${socketId}_resume.pdf`);
      fs.writeFileSync(filePath, base64Data, 'base64');

      const fileUrl = `/uploads/${socketId}_resume.pdf`;
      user.resumeURL = fileUrl;
      await user.save();
      state.stage = 'done';

      socket.emit('bot-message', `✅ Resume uploaded successfully! 📝\n🔗 [View Resume](${fileUrl})`);

      setTimeout(() => {
        socket.emit('bot-message', '🎉 Thank you for applying! We’ll review your resume and get back to you via email. 📬');
      }, 1000);

      sendMail(user.email);
    } else {
      socket.emit('bot-message', '⚠️ Upload a valid PDF file in base64 format.');
    }
    return;
  }

  // If process is already done
  else {
    socket.emit('bot-message', '✅ Your application has already been submitted.');
  }
};

module.exports = { handleUserMsg };


// ----------------------------
// ✉️ Email Sending Function
const sendMail = async (recipientEmail) => {
  console.log('📧 Sending mail to:', recipientEmail);

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: '"HR Bot 🤖" <' + process.env.EMAIL + '>',
      to: recipientEmail,
      subject: 'Thank you for applying for a job 🙌',
      text: `Hello ${recipientEmail},

Thank you for applying for the position at our company.

📄 We’ve received your application and our team is reviewing it.

If shortlisted, we’ll get in touch soon with the next steps.
For updates, just reply to this email or type "status" in the chat.

Best of luck! 🍀
– HR_Bot 🤖`
    });

    console.log('✅ Email sent:', info.messageId);
  } catch (error) {
    console.error('❌ Error sending email:', error);
  }
};

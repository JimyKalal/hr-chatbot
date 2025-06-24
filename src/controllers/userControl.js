const User = require('../models/userDetails');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const handleUserMsg = async (socket, msg) => {
  console.log("User Message:", msg);
  
  let user = await User.findOne({ socketId: socket.id });

  if (!user) {
     console.log('⚠️ No user found for socket:', socket.id);
    socket.emit('bot-message', 'Session expired or user not recognized. Please log in again.');
    return;
  }
console.log(user.currentStep, user.introShown);
  
  if (user.currentStep === 'intro') {
    if (!user.introShown) {
      user.introShown = true;
      await user.save();
      socket.emit('bot-message', 'Hello! Want to apply for a job?');
      socket.emit('bot-options', ['Yes', 'No']);
      return;
    } 
    else if (msg.toLowerCase() === 'yes') {
      user.applicationType = 'Yes';
      user.currentStep = 'graduation';
      await user.save();
      socket.emit('bot-message', 'What is your graduation?');
      socket.emit('bot-options', ['B-tech', 'B.Sc', 'M-tech']);
      return;
    } 
    else if (msg.toLowerCase() === 'no') {
      user.applicationType = 'No';
      user.currentStep = 'done';
      await user.save();
      socket.emit('bot-message', 'No worries! Have a great day!');
      return;
    } 
    else {
      socket.emit('bot-message', 'Please choose Yes or No to continue.');
      socket.emit('bot-options', ['Yes', 'No']);
      return;
    }
  }

  
  else if (user.currentStep === 'graduation') {
    user.graduation = msg;
    user.currentStep = 'domain';
    await user.save();
      console.log('👍 Moved to domain step');
    socket.emit('bot-message', 'Choose your Domain.');
    socket.emit('bot-options', ['Web-Development', 'AI/ML', 'Data-science', 'Cloud Computing', 'Quality-assessment']);
    return;
  }

  
  else if (user.currentStep === 'domain') {
    user.domain = msg;
    user.currentStep = 'skills';
    await user.save();
    socket.emit('bot-message', 'Select your skills (multiple, comma-separated)');
    socket.emit('bot-options', ['HTML', 'CSS', 'JavaScript', 'node-js', 'express-js', 'mongoDB', 'ejs']);
    return;
  }

  
  else if (user.currentStep === 'skills') {
    const known = ['HTML', 'CSS', 'JavaScript', 'node-js', 'express-js', 'mongoDB', 'ejs'];
    if (msg.includes(',') && known.some(k => msg.includes(k))) {
      user.skills = msg.split(',').map(s => s.trim());
      user.currentStep = 'experience';
      await user.save();
      socket.emit('bot-message', 'Do you have any prior experience?');
      socket.emit('bot-options', ['Yes', 'No']);
    } else {
      socket.emit('bot-message', 'Please enter at least one skill, comma-separated.');
      socket.emit('bot-options', known);
    }
    return;
  }

  
  else if (user.currentStep === 'experience') {
    if (msg.toLowerCase() === 'yes') {
      user.currentStep = 'experienceValue';
      await user.save();
      socket.emit('bot-message', 'How much experience do you have?');
      socket.emit('bot-options', ['< 2 years', '2 to 5 years', '> 5 years']);
    } else if (msg.toLowerCase() === 'no') {
      user.experience = 'No';
      user.currentStep = 'package';
      await user.save();
      socket.emit('bot-message', 'What is your expected package?');
      socket.emit('bot-options', ['2 LPA', '3 LPA', '4 LPA', '5 LPA', '6+ LPA']);
    } else {
      socket.emit('bot-message', 'Please choose Yes or No.');
      socket.emit('bot-options', ['Yes', 'No']);
    }
    return;
  }

  
  else if (user.currentStep === 'experienceValue') {
    const options = ['< 2 years', '2 to 5 years', '> 5 years'];
    if (options.includes(msg.trim())) {
      user.experience = msg;
      user.currentStep = 'package';
      await user.save();
      socket.emit('bot-message', 'What is your expected package?');
      socket.emit('bot-options', ['2 LPA', '3 LPA', '4 LPA', '5 LPA', '6+ LPA']);
    } else {
      socket.emit('bot-message', 'Select one of the given experience options.');
      socket.emit('bot-options', options);
    }
    return;
  }

  else if (user.currentStep === 'package') {
    user.expectedPackage = msg;
    user.currentStep = 'resume';
    await user.save();
    socket.emit('bot-message', 'Please upload your resume as a base64-encoded PDF.');
    return;
  }

  else if (user.currentStep === 'resume') {
    if (msg.startsWith('data:application/pdf;base64,')) {
      const base64Data = msg.split(',')[1];
      const filePath = path.join(__dirname, `../uploads/resume_${user._id}.pdf`);
      fs.writeFileSync(filePath, base64Data, 'base64');

      user.resumeURL = `/uploads/resume_${user._id}.pdf`;
      user.currentStep = 'done';
      await user.save();
      socket.emit('bot-message', `Resume uploaded! View: ${user.resumeURL}`);
      socket.emit('bot-message', 'Thank you! We will email you regarding our job response.');

      sendMail('meetgajjar1010@gmail.com'); // Ensure correct email
    } else {
      socket.emit('bot-message', 'Upload a valid PDF (base64) file.');
    }
    return;
  }

  else {
    socket.emit('bot-message', 'Session complete. Thank you again!');
    return;
  }
};


module.exports = { handleUserMsg };




const sendMail = async (data) => {
    console.log(sendMail);

    const transport = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL,
            pass: process.env.EMAIL_PASSWORD,
        },
    });

    try {

        const info = await transport.sendMail({
            from: " Hr-bot",
            to: data,
            subject: 'Thank you for applying for a job.',
            text: `Hello [Candidate Name],

Thank you for applying for the position at our Company  
We’ve received your application and our team is reviewing it.

If shortlisted, we’ll get in touch soon with the next steps.
For updates, just reply to this email or type status in the chat.

Best of luck!
– HR_Bot`
        })
        console.log(info);

        return null;
    } catch (error) {
        console.error(error);
    }

}


module.exports = { handleUserMsg };

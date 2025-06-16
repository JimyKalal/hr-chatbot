const User = require('../models/userDetails');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer')

const handleUserMsg = async (socket, msg) => {
    let user = await User.findOne({ socketId: socket.id });

    if (!user) {
        user = new User({ socketId: socket.id, introShown: false, currentStep: 'intro' });
        await user.save();
    }

    if (user.currentStep === 'intro') {
        if (msg.toLowerCase() === 'yes') {
            user.applicationType = 'Yes';
            user.introShown = true;
            user.currentStep = 'graduation';
            await user.save();

            socket.emit('bot-message', 'What is your graduation?');
            socket.emit('bot-options', ['B-tech', 'B.Sc', 'M-tech']);
        } else if (msg.toLowerCase() === 'no') {
            user.applicationType = 'No';
            user.introShown = true;
            await user.save();

            socket.emit('bot-message', 'No worries! Have a great day!');
        } else {
            socket.emit('bot-message', 'Hello! Want to apply for a job?');
            socket.emit('bot-options', ['Yes', 'No']);
        }
        return;
    }

    else if (user.currentStep === 'graduation') {
        user.graduation = msg;
        user.currentStep = 'domain';
        await user.save();

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
        const knownSkills = ['HTML', 'CSS', 'JavaScript', 'node-js', 'express-js', 'mongoDB', 'ejs'];
        if (msg.includes(',') && knownSkills.some(skill => msg.includes(skill))) {
            const newSkills = msg.split(',').map(s => s.trim());
            user.skills = newSkills;
            user.currentStep = 'experience';
            await user.save();

            socket.emit('bot-message', 'Do you have any prior experience?');
            socket.emit('bot-options', ['Yes', 'No']);
        } else {
            socket.emit('bot-message', 'Please enter multiple skills separated by commas.');
        }
        return;
    }

    else if (user.currentStep === 'experience') {
        const options = ['< 2 years', '2 to 5 years', '> 5 years'];
        if (msg.toLowerCase() === 'yes') {
            user.currentStep = 'experienceValue';
            await user.save();
            socket.emit('bot-message', 'How much experience do you have?');
            socket.emit('bot-options', options);
        } else if (msg.toLowerCase() === 'no') {
            user.experience = 'No';
            user.currentStep = 'package';
            await user.save();

            socket.emit('bot-message', 'What is your expected package?');
            socket.emit('bot-options', ['2 LPA', '3 LPA', '4 LPA', '5 LPA', '6+ LPA']);
        } else {
            socket.emit('bot-message', 'Please select Yes or No.');
        }
        return;
    }

    else if (user.currentStep === 'experienceValue') {
        const options = ['< 2 years', '2 to 5 years', '> 5 years'];
        if (options.includes(msg)) {
            user.experience = msg;
            user.currentStep = 'package';
            await user.save();

            socket.emit('bot-message', 'What is your expected package?');
            socket.emit('bot-options', ['2 LPA', '3 LPA', '4 LPA', '5 LPA', '6+ LPA']);
        } else {
            socket.emit('bot-message', 'Please select a valid experience option.');
        }
        return;
    }

    else if (user.currentStep === 'package') {
        user.expectedPackage = msg;
        user.currentStep = 'resume';
        await user.save();

        socket.emit('bot-message', 'Please upload your Resume as a base64 PDF.');
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


            sendMail('meetgajjar1010@gmail.com')
            // socket.emit('send-email', 'meetgajjar1010@gmail.com')
        } else {
            socket.emit('bot-message', 'Invalid format. Upload a valid PDF (base64).');
        }
        return;
    }

    else if (user.currentStep === 'done') {
        socket.emit('bot-message', 'Thank you again! We have received your information.');
        return;
    }
};




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
            subject: 'Thank you for applying application',
            text: `Hello [Candidate Name],

Thank you for applying for the [Job Title] position at [Your Company Name]! 🤝
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

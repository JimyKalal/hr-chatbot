const mongoose = require('mongoose');

const userDetailschema = new mongoose.Schema({

    email:{
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
     password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'hr'],
        default: 'user'
    },


    socketId : String,
    applicationType : String,
    graduation : String,
    domain : String,
    skills : [String],
    experience : String,
    expectedPackage : String,
    resumeURL : String,
    createdAT : {
        type : Date,
        Default : Date.now
    },
      introShown: {
    type: Boolean,
    default: false
  },
    currentStep: {
  type: String,
  default: 'intro'
}

    });
module.exports = mongoose.model('User',userDetailschema);

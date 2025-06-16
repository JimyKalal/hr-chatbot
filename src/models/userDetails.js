const mongoose = require('mongoose');

const userDetailschema = new mongoose.Schema({
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
    currentStep: {
  type: String,
  default: 'intro'
}

    });
module.exports = mongoose.model('User',userDetailschema);

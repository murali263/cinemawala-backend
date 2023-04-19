const User = require('../models/user');
const Emailverification = require('../models/emailverification');
const nodemailer = require('nodemailer');
const { isValidObjectId } = require('mongoose');



//  create user and send otp api

exports.create = async (req, res) => {
    const { name, email, password } = req.body;
    const olduser = await User.findOne({ email });
    if (olduser) return res.status(401).json({ error: `${email} already exists` })
    const newUser = new User({ name, email, password });
    newUser.save()
    // generate 6 digits otp
    let otp = ""
    for (let i = 0; i < 5; i++) {
        let randomval = Math.round(Math.random() * 9);
        otp += randomval
    }
    const emailverifcationcode = new Emailverification({ owner: newUser._id, token: otp });
    await emailverifcationcode.save()
    var transport = nodemailer.createTransport({
        host: "sandbox.smtp.mailtrap.io",
        port: 2525,
        auth: {
            user: "f1cb50ae21869a",
            pass: "fade2b172ccedd"
        }
    });
    transport.sendMail({
        from: "verificationemail@cinemawala.com",
        to: newUser.email,
        subject: 'verification code',
        html: `<h1>verification code</h1>
    <p>${otp}</p>`
    })
    res.status(201).json({ success: 'Please verify you email. OTP has been sent to your email account!' })
}



// verify otp

// exports.verifyEmail = async (req,res) =>{
// const {userId,OTP} = req.body;

// if(!isValidObjectId(userId)) return res.status(401).json({error:'invalid user..!'});


// const user =await  User.findById(userId);

// if(!user) return res.sendError(res,'user not found');

// if(user.isVerify) return res.sendError(res,'user alredy exist')

// const token = await new Emailverification({owner:userId});

// if(!token) return res.sendError(res,'token not found');

// // const isMatched = await token.compaireToken(OTP);
// //   if (!isMatched) return sendError(res, "Please submit a valid OTP!");

//   User.isVerify = true;
//   await User.save()
//   await EmailVerificationToken.findByIdAndDelete(token._id);
//   var transport = nodemailer.createTransport({
//     host: "sandbox.smtp.mailtrap.io",
//     port: 2525,
//     auth: {
//         user: "f1cb50ae21869a",
//         pass: "fade2b172ccedd"
//     }
// });
// transport.sendMail({
//     from: "verificationemail@cinemawala.com",
//     to: newUser.email,
//     subject: 'welcome to cinemawala',
//     html: `<h1>Welcome to our thanks for coosing us</h1>`
// })
// res.status(201).json({ success: 'Your email is verified...!' })
// }



exports.verifyEmail = async (req, res) => {
    const { userId, OTP } = req.body;
  
    if (!isValidObjectId(userId)) return res.json({ error: "Invalid user!" });
  
    const user = await User.findById(userId);
    if (!user) return sendError(res, "user not found!", 404);
  
    if (user.isVerified) return sendError(res, "user is already verified!");
  
    const token = await Emailverification.findOne({ owner: userId });
    if (!token) return sendError(res, "token not found!");
  
    const isMatched = await token.compaireToken(OTP);
    if (!isMatched) return sendError(res, "Please submit a valid OTP!");
  
    user.isVerified = true;
    await user.save();
  
    await Emailverification.findByIdAndDelete(token._id);
  
     var transport = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
        user: "f1cb50ae21869a",
        pass: "fade2b172ccedd"
    }
});
    transport.sendMail({
      from: "verification@reviewapp.com",
      to: user.email,
      subject: "Welcome Email",
      html: "<h1>Welcome to our app and thanks for choosing us.</h1>",
    });
    res.json({ message: "Your email is verified." });
  };

const User = require('../models/user');
const jwt = require('jsonwebtoken')
const Emailverification = require('../models/emailverification');
const nodemailer = require('nodemailer');
const { isValidObjectId } = require('mongoose');
const { generateOTP, generateMailTransporter } = require("../helpers/mail");
const { sendError, generateRandomByte } = require('../helpers/helpers');
const { PasswordResetToken } = require('../models/resetpassword')


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


exports.resendEmailVerificationToken = async (req, res) => {
    const { userId } = req.body;

    const user = await User.findById(userId);
    if (!user) return sendError(res, "user not found!");

    if (user.isVerified)
        return sendError(res, "This email id is already verified!");

    const alreadyHasToken = await EmailVerificationToken.findOne({
        owner: userId,
    });
    if (alreadyHasToken)
        return sendError(
            res,
            "Only after one hour you can request for another token!"
        );

    // generate 6 digit otp
    let OTP = generateOTP();

    // store otp inside our db
    const newEmailVerificationToken = new EmailVerificationToken({
        owner: user._id,
        token: OTP,
    });

    await newEmailVerificationToken.save();

    // send that otp to our user

    var transport = generateMailTransporter();

    transport.sendMail({
        from: "verification@reviewapp.com",
        to: user.email,
        subject: "Email Verification",
        html: `
        <p>Your verification OTP</p>
        <h1>${OTP}</h1>
  
      `,
    });

    res.json({
        message: "New OTP has been sent to your registered email accout.",
    });
};



exports.forgetPassword = async (req, res) => {
    const { email } = req.body;

    if (!email) return sendError(res, "email is missing!");

    const user = await User.findOne({ email });
    if (!user) return sendError(res, "User not found!", 404);

    const alreadyHasToken = await PasswordResetToken.findOne({ owner: user._id });
    if (alreadyHasToken)
        return sendError(
            res,
            "Only after one hour you can request for another token!"
        );

    const token = await generateRandomByte();
    const newPasswordResetToken = await PasswordResetToken({
        owner: user._id,
        token,
    });
    await newPasswordResetToken.save();

    const resetPasswordUrl = `http://localhost:3000/reset-password?token=${token}&id=${user._id}`;

    const transport = generateMailTransporter();

    transport.sendMail({
        from: "security@reviewapp.com",
        to: user.email,
        subject: "Reset Password Link",
        html: `
        <p>Click here to reset password</p>
        <a href='${resetPasswordUrl}'>Change Password</a>
      `,
    });

    res.json({ message: "Link sent to your email!" });
};



exports.singIn = async (req,res)=>{
    const {email,password} = req.body;
    
    const user = await User.findOne({email});
    if(!user) return sendError(res,'Email/Password mismatch');

    const matched = await user.comparePassword(password)
    if(!matched) return sendError(res,'Email/Password mismatch');

    const {_id,name} =  user

    const jwtToken = jwt.sign({userId:_id},'ueygryefcsbduae');
    res.json({
        user: { id: _id, name, email, token: jwtToken },
      });
}


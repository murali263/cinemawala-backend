const express = require('express');
const { userValidtor, validate ,signInValidator} = require("../middleware-validators/validators");
const router = express.Router();
const {create,verifyEmail,resendEmailVerificationToken,forgetPassword,singIn} = require('../controllers/user')

router.post("/create", userValidtor, validate, create);
router.post("/verify-email", verifyEmail);
router.post("/resend-email-verification-token", resendEmailVerificationToken);
router.post('/forget-password', forgetPassword)
router.post("/sign-in", signInValidator, validate, singIn);


module.exports = router;




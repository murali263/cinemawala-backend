const express = require('express');
const { userValidtor, validate } = require("../middleware-validators/validators");
const router = express.Router();
const {create,verifyEmail} = require('../controllers/user')

router.post("/create", userValidtor, validate, create);
router.post("/verify-email", verifyEmail);



module.exports = router;




const express = require('express');

const router = express.Router();
const {create} = require('../controllers/user')

router.get('/create',create)


module.exports = router;
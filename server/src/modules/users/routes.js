const express = require('express');
const router = express.Router();
const { auth } = require('../../middleware/auth');
const { getMe, updateMe } = require('./controller');

router.use(auth);
router.get('/me', getMe);
router.patch('/me', updateMe);

module.exports = router;

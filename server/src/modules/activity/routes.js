const express = require('express');
const router = express.Router();
const { auth } = require('../../middleware/auth');
const { getActivityLogs } = require('./controller');

router.use(auth);
router.get('/', getActivityLogs);

module.exports = router;

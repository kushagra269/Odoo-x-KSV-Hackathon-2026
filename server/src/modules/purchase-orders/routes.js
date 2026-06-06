const express = require('express');
const router = express.Router();
const { auth } = require('../../middleware/auth');
const { getAllPOs, getPOById } = require('./controller');

router.use(auth);

router.get('/', getAllPOs);
router.get('/:id', getPOById);

module.exports = router;

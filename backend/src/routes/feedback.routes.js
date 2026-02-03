const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedback.controller');

router.get('/', feedbackController.getAll);

module.exports = router;

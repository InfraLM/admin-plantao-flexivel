const express = require('express');
const router = express.Router();
const afterController = require('../controllers/after.controller');

router.get('/', afterController.getAll);
router.get('/:matricula/:data_plantao', afterController.getById);
router.post('/', afterController.create);
router.put('/:matricula/:data_plantao', afterController.update);
router.delete('/:matricula/:data_plantao', afterController.delete);

module.exports = router;

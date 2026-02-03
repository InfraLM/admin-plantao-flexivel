const express = require('express');
const router = express.Router();
const tentativasController = require('../controllers/tentativas.controller');

router.get('/', tentativasController.getAll);
router.get('/count/:matricula', tentativasController.getCount);
router.post('/', tentativasController.create);
router.delete('/:matricula/:data_tentativa/:data_possivel_plantao', tentativasController.delete);

module.exports = router;

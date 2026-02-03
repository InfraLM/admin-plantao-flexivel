const express = require('express');
const router = express.Router();
const plantoesController = require('../controllers/plantoes.controller');

// Rotas para Plantões
router.get('/', plantoesController.getAll);
router.post('/', plantoesController.create);
router.put('/:matricula/:data_plantao', plantoesController.updateStatus);
router.delete('/:matricula/:data_plantao', plantoesController.delete);

module.exports = router;

const express = require('express');
const router = express.Router();
const { createTask } = require('../controllers/taskController');

// POST /api/tasks/create
router.post('/create', createTask);

module.exports = router;

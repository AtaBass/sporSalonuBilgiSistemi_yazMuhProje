const { Router } = require('express');
const auth = require('../middlewares/authMiddleware');
const c = require('../controllers/dashboardController');

const router = Router();
router.use(auth);
router.get('/summary', c.summary);

module.exports = router;

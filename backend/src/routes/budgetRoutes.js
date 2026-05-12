const { Router } = require('express');
const auth = require('../middlewares/authMiddleware');
const { requireRoles } = require('../middlewares/roleMiddleware');
const c = require('../controllers/budgetController');

const router = Router();
router.use(auth);
router.get('/summary', c.summary);
router.get('/', requireRoles('YONETICI'), c.range);

module.exports = router;

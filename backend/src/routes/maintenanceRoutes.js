const { Router } = require('express');
const auth = require('../middlewares/authMiddleware');
const { requireRoles } = require('../middlewares/roleMiddleware');
const c = require('../controllers/maintenanceController');

const router = Router();
router.use(auth);
router.get('/upcoming', c.listUpcoming);
router.get('/', c.list);
router.post('/', c.create);
router.put('/:id', requireRoles('YONETICI'), c.update);
router.delete('/:id', requireRoles('YONETICI'), c.remove);

module.exports = router;

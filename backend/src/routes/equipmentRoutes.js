const { Router } = require('express');
const auth = require('../middlewares/authMiddleware');
const { requireRoles } = require('../middlewares/roleMiddleware');
const c = require('../controllers/equipmentController');

const router = Router();
router.use(auth);
router.get('/', c.list);
router.get('/:id', c.getById);
router.post('/', requireRoles('YONETICI'), c.create);
router.put('/:id', c.update);
router.delete('/:id', requireRoles('YONETICI'), c.remove);

module.exports = router;

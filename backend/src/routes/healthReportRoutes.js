const { Router } = require('express');
const auth = require('../middlewares/authMiddleware');
const { requireRoles } = require('../middlewares/roleMiddleware');
const c = require('../controllers/healthReportController');

const router = Router();
router.use(auth);
router.get('/expired', c.listExpired);
router.get('/missing', c.listMissing);
router.get('/', c.list);
router.post('/', requireRoles('YONETICI'), c.create);
router.put('/:id', requireRoles('YONETICI'), c.update);
router.delete('/:id', requireRoles('YONETICI'), c.remove);

module.exports = router;

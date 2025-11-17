const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

const {
  likeCompanion,
  superLikeCompanion,
  passCompanion,
  getMatches,
  unmatch
} = require('../controllers/matchController');

router.use(protect);

router.post('/like/:companionId', likeCompanion);
router.post('/super-like/:companionId', superLikeCompanion);
router.post('/pass/:companionId', passCompanion);
router.get('/', getMatches);
router.delete('/:id', unmatch);

module.exports = router;

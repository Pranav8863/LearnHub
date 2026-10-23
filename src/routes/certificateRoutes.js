const express = require('express');
const router = express.Router();
const {
  claimCertificate,
  getMyCertificates,
  verifyCertificate,
} = require('../controllers/certificateController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/courses/:courseId/claim', authenticateToken, claimCertificate);
router.get('/certificates/my-certificates', authenticateToken, getMyCertificates);
router.get('/certificates/verify/:certificateId', verifyCertificate);

module.exports = router;

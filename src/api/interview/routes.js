const auth = require('../../middleware/auth');
const { scheduleInterview, getInterviewsByUserId, updateInterviewByUuid, getQuestionsByType,askInterviewQuestion,getInterviewByUuid } = require('./controller');

const router = require('express').Router();

router.post('/schedule', auth, scheduleInterview);
router.get('/interviews/:user_id', auth, getInterviewsByUserId);
router.put('/interviews/:uuid', auth, updateInterviewByUuid);
router.get('/questions', getQuestionsByType);
router.post('/ask-question', auth, askInterviewQuestion);
router.get('/getScheduledInterview/:uuid', getInterviewByUuid);

module.exports = router;
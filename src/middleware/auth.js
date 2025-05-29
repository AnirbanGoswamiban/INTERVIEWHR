const { verifyToken } = require('../config/firebase');
const {supabase}=require('../config/supabase')

const auth = async (req, res, next) => {
    try {
        let token = req.headers.authorization;
        if(req.body.scheduleInterview && req.body.id){
            const { data: interview, error } = await supabase
                .from('interview_table')
                .select('*')
                .eq('id',req.body.id)
            if(error){
                return res.status(401).json({
                type: 'failed',
                message: 'failed to authenticate'
            });
            }
            req.body.email=interview[0].email
            return next()
        }
        if (!token) {
            return res.status(401).json({
                type: 'failed',
                message: 'failed to authenticate'
            });
        }
        token = token.split(' ')[1];

        const decodedToken = await verifyToken(token);
        if (!decodedToken || Array.isArray(decodedToken)) {
            return res.status(401).json({
                type: 'failed',
                message: 'failed to authenticate'
            });
        }

        req.user = decodedToken;
        next();
    } catch (error) {
        return res.status(401).json({
            type: 'failed',
            message: 'failed to authenticate'
        });
    }
};

module.exports = auth;
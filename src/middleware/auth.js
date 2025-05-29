const { verifyToken } = require('../config/firebase');

const auth = async (req, res, next) => {
    try {
        let token = req.headers.authorization;
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
const admin = require('firebase-admin');

const initializeFirebase = () => {
    try {
        // Check if Firebase is already initialized
        if (admin.apps.length === 0) {
            admin.initializeApp({
                projectId: process.env.FIREBASE_PROJECT_ID,
                // No need for credentials as we're only verifying tokens
            });
            console.log('Firebase Admin SDK initialized successfully');
        } else {
            console.log('Firebase Admin SDK already initialized');
        }
    } catch (error) {
        console.error('Error initializing Firebase Admin SDK:', error);
        throw error;
    }
};

const verifyToken = async (idToken) => {
    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        return decodedToken;
    } catch (error) {
        console.error('Error verifying token:', error);
        throw error;
    }
};

module.exports = {
    initializeFirebase,
    verifyToken,
    admin
}; 
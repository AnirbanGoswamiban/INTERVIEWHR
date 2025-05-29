const { supabase } = require('../../config/supabase');
const { admin } = require('../../config/firebase');
const { verifyToken } = require('../../config/firebase');

const authenticateUser = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.split('Bearer ')[1];

        // Verify the Firebase token
        const decodedToken = await verifyToken(token);
        
        // Extract user information
        const { uid, email, name, picture } = decodedToken;

        // Check if user already exists in Supabase
        const { data: existingUser, error: fetchError } = await supabase
            .from('user_table')
            .select('*')
            .eq('email', email)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
            throw fetchError;
        }

        let userData;
        
        if (!existingUser) {
            // Insert new user if doesn't exist
            const { data: newUser, error: insertError } = await supabase
                .from('user_table')
                .insert([
                    {
                        email: email,
                        name: name,
                        created_at: new Date().toISOString()
                    }
                ])
                .select()
                .single();

            if (insertError) throw insertError;
            userData = newUser;
        } else {
            userData = existingUser;
        }

        // Return user data with new format
        return res.status(200).json({
            type: "success",
            message: "logged in successfully",
            user: userData
        });

    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(401).json({
            type: "error",
            message: "Authentication failed"
        });
    }
};

module.exports = {
    authenticateUser
};
const { supabase } = require('../../config/supabase');
const {sendEmail} = require('../../util/nodeMailer');
const { askLLM } = require('../../config/gemini');
const path = require('path');

const scheduleInterview = async (req, res) => {
    const { user_id, type, email, expires_in, questionCount } = req.body;

    // Insert interview data
    const { data: interview, error: insertError } = await supabase
        .from('interview_table')
        .insert([
            {
                user_id,
                type,
                email,
                expires_in,
                questionCount:questionCount
            }
        ])
        .select();

    if (insertError) {
        return res.status(400).json({ 
            type: 'failed',
            message: insertError.message 
        });
    }

    // const emailData = {
    //     to: email,
    //     subject: 'Interview Scheduled',
    //     text: `Your interview has been scheduled for ${expires_in} days. Please login to the platform to start the interview.`
    // };

    const emailData = {
        to: email,
        subject: 'Interview Scheduled',
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #2a9d8f;">Interview Scheduled</h2>
                <p>Hello,</p>
                <p>Your interview has been scheduled and will expire in <strong>${expires_in}</strong> day(s).</p>
                <p>Please click the button below to complete your interview:</p>
                <a href="http://localhost:5173/scheduledInterview?id=${interview[0].id}" 
                   style="display: inline-block; padding: 10px 20px; background-color: #2a9d8f; color: white; text-decoration: none; border-radius: 5px;">
                   Complete Interview
                </a>
                <p style="margin-top: 20px;">If the button doesn't work, you can also use this link:</p>
                <p><a href="http://localhost:5173/scheduledInterview?id=${interview[0].id}">
                    http://localhost:5173/scheduledInterview?id=${interview[0].id}
                </a></p>
                <p>Good luck!</p>
            </div>
        `
    };
    

     try {
        sendEmail(emailData);
     } catch (error) {
        console.log("ERROR IN SENDING EMAIL",error);
     }

    return res.status(200).json({ 
        type: 'success',
        message: interview 
    });
}

const getInterviewsByUserId = async (req, res) => {
    const { userId } = req.params;

    const { data: interviews, error } = await supabase
        .from('interview_table')
        .select('*')
        .eq('user_id', userId);

    if (error) {
        return res.status(400).json({ 
            type: 'failed',
            message: error.message 
        });
    }

    return res.status(200).json({ 
        type: 'success',
        message: interviews 
    });
}

const updateInterviewByUuid = async (req, res) => {
    const { uuid } = req.params;
    const updateData = req.body;

    const { data: interview, error } = await supabase
        .from('interview_table')
        .update(updateData)
        .eq('uuid', uuid)
        .select();

    if (error) {
        return res.status(400).json({ 
            type: 'failed',
            message: error.message 
        });
    }

    if (!interview || interview.length === 0) {
        return res.status(404).json({ 
            type: 'failed',
            message: 'Interview not found' 
        });
    }

    return res.status(200).json({ 
        type: 'success',
        message: interview[0] 
    });
}

const getQuestionsByType = async (req, res) => {
    const { type } = req.query;

    if (!type) {
        return res.status(400).json({
            type: 'failed',
            message: 'Type parameter is required'
        });
    }

    const { data: questions, error } = await supabase
        .from('question_module')
        .select('*')
        .eq('type', type);

    if (error) {
        return res.status(400).json({
            type: 'failed',
            message: error.message
        });
    }

    return res.status(200).json({
        type: 'success',
        message: questions
    });
}

const askInterviewQuestion = async (req, res) => {
    const { userMessage, email, numberToAsk, topic, endInterview } = req.body;

    if (!userMessage || !email || !numberToAsk || !topic) {
        return res.status(400).json({
            type: 'failed',
            message: 'Missing required parameters: userMessage, email, numberToAsk, and topic are required'
        });
    }

    try {
        const response = await askLLM(userMessage, email, numberToAsk, topic, endInterview);

        if(req.body.scheduleInterview && response === "XXXXXEND OF INTERVIEWXXXXX"){
            const { data: interview, error } = await supabase
                .from('interview_table')
                .update({ status: "submitted" })
                .eq('id', req.body.id)
                .select();

                const emailData = {
                    to: interview[0].email,
                    subject: 'Interview Report',
                    html: `
                        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                            <h2 style="color: #2a9d8f;">Report</h2>
                        </div>
                    `,
                    attachments: [
                        {
                            filename: `${email}.pdf`,  
                            path: path.join(__dirname,'../../../reports', `${email}.pdf`),
                            contentType: 'text/html'
                        }
                    ]
                };
            
            sendEmail(emailData);
        }
        
        if (response === "XXXXXEND OF INTERVIEWXXXXX") {
            return res.status(200).json({
                type: 'success',
                message: response,
                llmStatus: "end"    
            });
        }
        
        return res.status(200).json({
            type: 'success',
            message: response
        });
    } catch (error) {
        console.error('Error in askInterviewQuestion:', error);
        return res.status(500).json({
            type: 'failed',
            message: error.message || 'Failed to get response from LLM'
        });
    }
}

const getInterviewByUuid = async (req, res) => {
    const { uuid } = req.params;
    const { data: interview, error } = await supabase
        .from('interview_table')
        .select('*')
        .eq('id', uuid);
    if (error) {
        return res.status(400).json({
            type: 'failed',
            message: error.message
        });
    }
    return res.status(200).json({
        type: 'success',
        message: interview[0]
    });
}


module.exports = {
    scheduleInterview,
    getInterviewsByUserId,
    updateInterviewByUuid,
    getQuestionsByType,
    askInterviewQuestion,
    getInterviewByUuid
};
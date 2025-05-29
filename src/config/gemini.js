const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
const PDFDocument = require('pdfkit');

const userStateMap = new Map(); // email -> state object
const userTimers = new Map();   // email -> timeout ID

const MAX_CONTEXT_LINES = 20; // To trim context
const SESSION_TIMEOUT = 60 * 60 * 1000; // 1 hour

function trimContext(context) {
  const lines = context.trim().split('\n');
  return lines.slice(-MAX_CONTEXT_LINES).join('\n');
}

function resetUserTimeout(email) {
  clearTimeout(userTimers.get(email));
  const timeout = setTimeout(() => {
    userStateMap.delete(email);
    userTimers.delete(email);
  }, SESSION_TIMEOUT);
  userTimers.set(email, timeout);
}

// function saveReportToFile(email, report) {
//   const filePath = path.join(__dirname, '../../reports', `${email}.txt`);
//   fs.writeFile(filePath, report, (err) => {
//     if (err) console.error(`Error saving report for ${email}:`, err);
//   });
// }

function saveReportToFile(email, report) {
  const filePath = path.join(__dirname, '../../reports', `${email}.pdf`);
  const doc = new PDFDocument();

  const writeStream = fs.createWriteStream(filePath);
  doc.pipe(writeStream);

  doc.fontSize(12).text(report, {
    align: 'left'
  });

  doc.end();

  writeStream.on('finish', () => {
    console.log(`PDF report saved for ${email}`);
  });

  writeStream.on('error', (err) => {
    console.error(`Error saving PDF report for ${email}:`, err);
  });
}

async function askGemini(prompt) {
  console.log("Calling Gemini...");
  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

async function askLLM(userMessage, email, numberToAsk, topic, endInterview = false) {
  let state = userStateMap.get(email);

  // End interview cleanup
  if (endInterview && state) {
    state.step = "done";
    const summaryPrompt = `Based on the following conversation, generate a professional interview feedback report:\n\n${state.context}`;
    const report = await askGemini(summaryPrompt);
    saveReportToFile(email, report);
    userStateMap.delete(email);
    userTimers.delete(email);
    return "XXXXXEND OF INTERVIEWXXXXX";
  }

  // First-time initialization
  if (!state) {
    state = {
      step: "intro",
      topic,
      askedCount: 0,
      maxQuestions: numberToAsk,
      context: `Topic: ${topic}\n`,
    };
    userStateMap.set(email, state);
  }

  resetUserTimeout(email);

  let prompt, reply;

  switch (state.step) {
    case "intro":
      prompt = `You are an interview assistant. Start by asking the candidate about their prior experience in ${topic}.`;
      reply = await askGemini(prompt);
      state.context += `\nAI: ${reply}`;
      state.step = "asking_questions";
      break;

    case "asking_questions":
      if (userMessage.trim().toLowerCase() === "skip/") {
        state.context += `\nUser: [Skipped]`;
      } else {
        state.context += `\nUser: ${userMessage}`;
      }

      if (state.askedCount < state.maxQuestions) {
        prompt = `Context: ${state.context}\nAsk a short to medium-length professional interview question about ${state.topic}.`;
        reply = await askGemini(prompt);
        state.context += `\nAI: ${reply}`;
        state.context = trimContext(state.context);
        state.askedCount++;
      } else {
        const evaluationPrompt = `Evaluate the candidate's answers and generate a professional interview feedback report based on the following conversation:\n\n${state.context}`;
        reply = await askGemini(evaluationPrompt);
        state.step = "done";
        saveReportToFile(email, reply);
        userStateMap.delete(email);
        userTimers.delete(email);
        return "XXXXXEND OF INTERVIEWXXXXX";
      }
      break;

    case "done":
      return "XXXXXEND OF INTERVIEWXXXXX";
  }

  userStateMap.set(email, state);
  return reply;
}

module.exports = {
  askLLM
};

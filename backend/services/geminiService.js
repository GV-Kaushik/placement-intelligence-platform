import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

// 1. Read the API key from environment variables
const apiKey = process.env.GEMINI_API_KEY;

// 2. Check if we should run in Mock Mode (if key is empty or default placeholder)
const isMockMode = !apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE';

if (isMockMode) {
  console.warn('⚠️ GEMINI_API_KEY is not configured in backend/.env. Running Mock Interview in MOCK mode.');
}

// 3. Initialize the Google Gen AI client only if we are in real mode
let genAI;
let model;
if (!isMockMode) {
  genAI = new GoogleGenerativeAI(apiKey);
  model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction: 'You are an elite technical interviewer. You ask sharp, realistic technical and behavioral questions one by one. You do not dump multiple questions at once. You follow up on candidate responses naturally.'
  });
}

/**
 * Helper to generate mock questions based on the question index (1 to 5)
 * This is used in Mock Mode so we have pre-defined questions ready.
 */
function getMockQuestion(questionIndex, company, role, difficulty) {
  const mockQuestions = [
    `Hi! Welcome to your mock interview for the ${role} position at ${company}. Let's start with a warm-up. Could you briefly introduce yourself and tell me about a technical project you are proud of?`,
    `Great. Let's move on to Operating Systems. How would you explain the difference between a process and a thread? How do they share memory?`,
    `Understood. Let's switch over to Database Management. Can you explain what database normalization is, and what the difference is between 2NF and 3NF?`,
    `Perfect. Let's do a Data Structures & Algorithms question. Suppose you are given a binary tree. How would you find the maximum depth of this tree? What would be the time and space complexity of your solution?`,
    `Excellent. Finally, let's wrap up with Computer Networks. What happens under the hood when you type a URL like 'https://google.com' in your browser and press Enter? Mention the protocols involved.`
  ];
  
  // Return the question that matches the index, or a generic follow-up if it goes out of bounds
  if (questionIndex - 1 < mockQuestions.length) {
    return mockQuestions[questionIndex - 1];
  }
  return `That makes sense. Can you elaborate on the scalability challenges of your proposed solution?`;
}

/**
 * Generates the next question in the interview sequence
 * @param {Array} chatHistory - Array of { role: 'user'|'model', text: '...' }
 * @param {string} company - Name of the target company
 * @param {string} role - Job role
 * @param {string} difficulty - Easy, Medium, or Hard
 */
export async function generateNextQuestion(chatHistory, company, role, difficulty) {
  // --- COUNT USER RESPONSES ---
  // We loop through the chatHistory array and count how many times the candidate (user)
  // has replied. This tells us what question number we are on.
  let userResponsesCount = 0;
  for (let i = 0; i < chatHistory.length; i++) {
    const currentMessage = chatHistory[i];
    if (currentMessage.role === 'user') {
      userResponsesCount = userResponsesCount + 1;
    }
  }

  // The next question index is (number of answers + 1)
  const nextQuestionIndex = userResponsesCount + 1;

  if (isMockMode) {
    // Simulate a brief delay (0.5 seconds) to feel like a real API call.
    // resolve => setTimeout(resolve, 500) waits for 500ms before continuing.
    await new Promise(resolve => setTimeout(resolve, 500));
    return getMockQuestion(nextQuestionIndex, company, role, difficulty);
  }

  try {
    // --- FORMAT HISTORY FOR GEMINI ---
    // Gemini's SDK expects history in a specific format: { role: 'user'|'model', parts: [{ text: '...' }] }
    // We create an empty array and use a standard 'for' loop to convert our simple database objects.
    const formattedHistory = [];
    for (let i = 0; i < chatHistory.length; i++) {
      const msg = chatHistory[i];
      
      let mappedRole = 'user';
      if (msg.role === 'model') {
        mappedRole = 'model';
      }

      formattedHistory.push({
        role: mappedRole,
        parts: [{ text: msg.text }]
      });
    }

    // Template literals with backticks (`) and ${} inject variables straight into the text block.
    const prompt = `We are conducting a ${difficulty} difficulty mock interview for the ${role} position at ${company}.
This is question number ${nextQuestionIndex} of 5.
Based on the interview transcript, evaluate the candidate's last answer. Then ask the next question.
Keep your response conversational, concise, and focused on asking ONE single question. Do not ask multiple questions.`;

    const chat = model.startChat({
      history: formattedHistory,
      generationConfig: {
        maxOutputTokens: 500,
      }
    });

    const result = await chat.sendMessage(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Error generating question from Gemini API:', error.message);
    // If Gemini fails due to quota or network, fallback to our mock questions
    return getMockQuestion(nextQuestionIndex, company, role, difficulty) + ' (API Fallback)';
  }
}

/**
 * Evaluates the full interview transcript and returns scores and detailed feedback
 * @param {Array} chatHistory - Array of { role: 'user'|'model', text: '...' }
 * @param {string} company - Target company
 * @param {string} role - Job role
 * @param {string} difficulty - Easy, Medium, Hard
 */
export async function evaluateInterview(chatHistory, company, role, difficulty) {
  if (isMockMode) {
    // Simulate thinking delay for 1.5 seconds so it feels real!
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate randomized scores for testing
    const dsa = Math.floor(Math.random() * 25) + 65; // Score between 65 and 90
    const os = Math.floor(Math.random() * 25) + 60;  // Score between 60 and 85
    const dbms = Math.floor(Math.random() * 20) + 70; // Score between 70 and 90
    const cn = Math.floor(Math.random() * 30) + 55;  // Score between 55 and 85
    const overall = Math.floor((dsa + os + dbms + cn) / 4);

    return {
      dsa_score: dsa,
      os_score: os,
      dbms_score: dbms,
      cn_score: cn,
      overall_score: overall,
      feedback_details: `Overall, you demonstrated solid preparation for a ${difficulty} interview for the ${role} role at ${company}. Your explanations for database normalization and multi-threading were conceptually sound. In Data Structures, you correctly outlined the DFS/BFS approach for binary tree depth, though you could have discussed boundary conditions more clearly. For computer networks, your understanding of DNS resolution and TCP handshake was good, but make sure to review the HTTP lifecycle in detail.`,
      weak_areas: ['Binary Tree Edge Cases', 'HTTP Lifecycle Details', 'OS Memory Sharing Locks']
    };
  }

  try {
    // --- BUILD TRANSCRIPT TEXT ---
    // We convert our database history array into a single text transcript paragraph.
    // We loop through messages, decide if the speaker is 'Interviewer' or 'Candidate',
    // and append each line to a single string separated by newlines (\n\n).
    let transcriptText = '';
    for (let i = 0; i < chatHistory.length; i++) {
      const msg = chatHistory[i];
      
      let speaker = 'Candidate';
      if (msg.role === 'model') {
        speaker = 'Interviewer';
      }

      transcriptText = transcriptText + speaker + ': ' + msg.text + '\n\n';
    }

    const evaluationPrompt = `You are an expert technical interviewer evaluator.
You will be given a transcript of a ${difficulty} difficulty mock interview for the ${role} position at ${company}.
Your task is to grade the candidate's answers and return a scorecard.

Here is the transcript:
---
${transcriptText}
---

Please evaluate the candidate across 4 domains (out of 100):
1. Data Structures & Algorithms (dsa_score)
2. Operating Systems (os_score)
3. Database Management Systems (dbms_score)
4. Computer Networks (cn_score)

Calculate an Overall Score (overall_score) out of 100 representing their average readiness.
Provide detailed feedback in 'feedback_details', explaining what they did well, what they missed, and how to improve.
Identify specific technical topics they struggled with and place them in the 'weak_areas' array.

You MUST respond with a valid JSON object matching the following structure:
{
  "dsa_score": 85,
  "os_score": 70,
  "dbms_score": 75,
  "cn_score": 60,
  "overall_score": 73,
  "feedback_details": "Your feedback analysis here...",
  "weak_areas": ["Topic A", "Topic B"]
}

Ensure your response is valid JSON. Set response format config if possible. Do not include markdown tags.`;

    const evalModel = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      // responseMimeType: "application/json" forces Gemini to output raw, clean JSON format
      // so it can be parsed by JSON.parse() without syntax errors or conversational text.
      generationConfig: { responseMimeType: "application/json" }
    });

    const response = await evalModel.generateContent(evaluationPrompt);
    const resultText = response.response.text();
    
    // Parse the JSON string into a real JavaScript object
    return JSON.parse(resultText);
  } catch (error) {
    console.error('Error evaluating interview with Gemini API:', error.message);
    // Fallback if the API fails, ensuring the system doesn't crash
    return {
      dsa_score: 70,
      os_score: 70,
      dbms_score: 70,
      cn_score: 70,
      overall_score: 70,
      feedback_details: 'The AI feedback generation encountered an issue, but your transcript was successfully saved. Keep practicing! Solid effort.',
      weak_areas: ['System Design Basics', 'Socket Connections']
    };
  }
}

/**
 * Generates a week-by-week study roadmap for a target company and time duration
 */
export async function generateAIStudyRoadmap(company, weeks) {
  if (isMockMode) {
    // Simulated mock roadmap for offline testing
    await new Promise(function(resolve) { setTimeout(resolve, 1000); });
    const mockRoadmap = [];
    for (let w = 1; w <= weeks; w++) {
      mockRoadmap.push({
        week: w,
        title: `Week ${w}: Core Placement Prep`,
        topics: [
          {
            name: `DSA - Topic ${w}`,
            description: "Practice arrays, sorting, searching, and key algorithms.",
            resource: "LeetCode top interview cards"
          },
          {
            name: `CS Theory - Topic ${w}`,
            description: "Revise concepts like DBMS normalization, OS thread sync, and socket basics.",
            resource: "GeeksforGeeks guidelines"
          }
        ],
        milestone: `Complete at least 5 coding exercises and 1 mock quiz by the end of week ${w}.`
      });
    }
    return mockRoadmap;
  }

  try {
    const prompt = `You are a career mentor. Generate a structured placement preparation roadmap for target company: ${company}.
The student has exactly ${weeks} weeks left.
Provide a week-by-week checklist containing topics to study, short descriptions, helpful resources/references, and a weekly milestone goal.

You MUST respond with a valid JSON array matching this structure:
[
  {
    "week": 1,
    "title": "Week Title",
    "topics": [
      {
        "name": "Topic Name",
        "description": "Topic details...",
        "resource": "Recommended article/platform..."
      }
    ],
    "milestone": "Weekly goal to complete..."
  }
]

Ensure your response is valid JSON. Do not include markdown formatting or extra conversational text.`;

    const evalModel = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: { responseMimeType: "application/json" }
    });

    const response = await evalModel.generateContent(prompt);
    const resultText = response.response.text();
    return JSON.parse(resultText);
  } catch (error) {
    console.error('Error generating AI study roadmap:', error.message);
    const fallbackRoadmap = [];
    for (let w = 1; w <= weeks; w++) {
      fallbackRoadmap.push({
        week: w,
        title: `Week ${w}: Study Topics`,
        topics: [
          {
            name: "Preparation & Coding",
            description: "Practice DSA and review interview topics.",
            resource: "GeeksforGeeks and LeetCode"
          }
        ],
        milestone: "Keep practicing technical questions."
      });
    }
    return fallbackRoadmap;
  }
}
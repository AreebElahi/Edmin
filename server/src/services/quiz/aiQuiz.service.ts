import prisma from '../../config/prisma.js';

/**
 * AI Quiz Generation Service
 * Generates quiz questions using Google Gemini API via fetch.
 * Falls back to deterministic generation if API key is missing.
 */

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || '';

interface GeneratedQuestion {
  questiontext: string;
  options: string[];
  correctanswer: string;
  type: 'MCQ' | 'TRUE_FALSE' | 'SHORT_ANSWER';
}

export const generateQuestionsWithAI = async (
  topic: string,
  difficulty: 'EASY' | 'MEDIUM' | 'HARD',
  questionType: 'MCQ' | 'TRUE_FALSE' | 'SHORT_ANSWER',
  questionCount: number,
  pdfText?: string
): Promise<GeneratedQuestion[]> => {
  // If no API key, throw an error so the frontend knows it failed
  if (!GOOGLE_API_KEY) {
    console.error('[AI Quiz] GOOGLE_API_KEY is not set in the environment variables.');
    throw new Error('AI generation is not configured on the server. Please check the API key.');
  }

  const typeInstruction = questionType === 'MCQ'
    ? 'multiple choice questions with exactly 4 options each'
    : questionType === 'TRUE_FALSE'
    ? 'true/false questions with options ["True", "False"]'
    : 'short answer questions (no options needed, set options to empty array)';

  const contextInstruction = pdfText 
    ? `\n\nBase your questions PRIMARILY on the following extracted PDF text. Ensure all questions can be answered using this source material:\n<SOURCE_TEXT>\n${pdfText}\n</SOURCE_TEXT>\n\n`
    : '';

  const prompt = `Generate exactly ${questionCount} ${difficulty.toLowerCase()} difficulty ${typeInstruction} about "${topic}".${contextInstruction}

Return a JSON array where each element has this exact structure:
{
  "questiontext": "The question text",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctanswer": "The correct option text exactly as it appears in options",
  "type": "${questionType}"
}

Rules:
- Return ONLY the JSON array, no markdown, no explanation
- Each question must be unique and educational
- For MCQ: exactly 4 options, one correct
- For TRUE_FALSE: options must be ["True", "False"]
- For SHORT_ANSWER: options should be [] and correctanswer is the expected answer
- The correctanswer must exactly match one of the options (for MCQ/TRUE_FALSE)
- Questions should be appropriate for a university-level course
- Difficulty ${difficulty}: ${{ EASY: 'basic recall and understanding', MEDIUM: 'application and analysis', HARD: 'synthesis, evaluation and critical thinking' }[difficulty]}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('[AI Quiz] Gemini API error:', response.status, errText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('No content in Gemini response');
    }

    // Parse JSON response — Gemini may wrap in markdown code block
    let cleanText = text.trim();
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const questions: GeneratedQuestion[] = JSON.parse(cleanText);

    // Validate
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error('Invalid response format from Gemini');
    }

    return questions.slice(0, questionCount).map((q, i) => ({
      questiontext: q.questiontext || `Question ${i + 1}`,
      options: Array.isArray(q.options) ? q.options : [],
      correctanswer: q.correctanswer || '',
      type: questionType,
    }));
  } catch (error: any) {
    console.error('[AI Quiz] AI generation failed:', error.message || error);
    // Throw the error upwards so the controller can return a 400/500 to the user
    throw new Error(`AI generation failed: ${error.message || 'Unknown error'}`);
  }
};

export const regenerateQuestionWithAI = async (
  topic: string,
  difficulty: 'EASY' | 'MEDIUM' | 'HARD',
  questionType: 'MCQ' | 'TRUE_FALSE' | 'SHORT_ANSWER',
  oldQuestionText: string,
  pdfText?: string
): Promise<GeneratedQuestion> => {
  if (!GOOGLE_API_KEY) {
    throw new Error('AI generation is not configured on the server. Please check the API key.');
  }

  const typeInstruction = questionType === 'MCQ'
    ? 'a multiple choice question with exactly 4 options'
    : questionType === 'TRUE_FALSE'
    ? 'a true/false question with options ["True", "False"]'
    : 'a short answer question (no options needed, set options to empty array)';

  const contextInstruction = pdfText 
    ? `\n\nBase your question PRIMARILY on the following extracted PDF text:\n<SOURCE_TEXT>\n${pdfText}\n</SOURCE_TEXT>\n\n`
    : '';

  const prompt = `Generate exactly 1 ${difficulty.toLowerCase()} difficulty ${typeInstruction} about "${topic}".
Important: Do NOT generate the following question: "${oldQuestionText}". Create a different but related question.${contextInstruction}

Return a single JSON object with this exact structure:
{
  "questiontext": "The question text",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctanswer": "The correct option text exactly as it appears in options",
  "type": "${questionType}"
}

Rules:
- Return ONLY the JSON object, no markdown, no explanation
- For MCQ: exactly 4 options, one correct
- For TRUE_FALSE: options must be ["True", "False"]
- For SHORT_ANSWER: options should be [] and correctanswer is the expected answer`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.8, responseMimeType: 'application/json' },
        }),
      }
    );

    if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);
    
    const data = await response.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('No content in Gemini response');
    
    let cleanText = text.trim();
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const question: GeneratedQuestion = JSON.parse(cleanText);
    return {
      questiontext: question.questiontext || 'Generated Question',
      options: Array.isArray(question.options) ? question.options : [],
      correctanswer: question.correctanswer || '',
      type: questionType,
    };
  } catch (error: any) {
    console.error('[AI Quiz] AI regeneration failed:', error.message || error);
    throw new Error(`AI regeneration failed: ${error.message || 'Unknown error'}`);
  }
};


export const generateContent = async (prompt: string): Promise<string> => {
  if (!process.env.GOOGLE_API_KEY) {
    return 'Gemini API key is not configured. This is a mock response from the AI.';
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
  } catch (err: any) {
    console.error('Error in generateContent:', err);
    return 'An error occurred while generating the response.';
  }
};

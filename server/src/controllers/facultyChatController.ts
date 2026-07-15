import { Request, Response } from 'express';
import { generateContent } from '../services/quiz/aiQuiz.service.js';
import catchAsync from '../utils/catchAsync.js';

export const chat = catchAsync(async (req: Request, res: Response) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ success: false, error: 'Message is required' });
  }

  const prompt = `You are a helpful AI assistant for faculty members at an educational institution. 
The user asks: ${message}
Provide a concise and helpful response.`;

  const responseText = await generateContent(prompt);

  res.status(200).json({ success: true, data: { response: responseText } });
});

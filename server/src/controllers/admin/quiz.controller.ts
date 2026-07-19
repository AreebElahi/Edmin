import { Request, Response } from 'express';
import { sendSuccess, sendError, ApiResponse } from '../../contracts/api.contracts.js';
import prisma from '../../config/prisma.js';
import { getCachedResponse, setCachedResponse } from "../../config/redis.js";

export const getQuizMetadataHandler = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const quizzes = await prisma.quiz.findMany({
      where: {
        metadata: {
          not: 'DbNull'
        }
      },
      include: {
        courseoffering: {
          include: {
            course: true,
            faculty: true
          }
        }
      },
      orderBy: {
        createdat: 'desc'
      }
    });

    const logs = (quizzes as any[]).map(q => {
      const meta = q.metadata as any;
      return {
        quizid: q.quizid,
        title: q.title,
        courseName: q.courseoffering?.course?.name || 'N/A',
        courseCode: q.courseoffering?.course?.code || 'N/A',
        instructor: q.courseoffering?.faculty?.fullname || 'N/A',
        difficulty: meta?.difficulty || 'N/A',
        topic: meta?.topic || 'N/A',
        questionCount: meta?.questionCount || 0,
        generatedAt: meta?.generatedAt || q.createdat
      };
    });

    // Compute stats
    const totalCount = logs.length;
    const avgQuestions = totalCount > 0 ? Number((logs.reduce((sum, item) => sum + item.questionCount, 0) / totalCount).toFixed(1)) : 0;
    
    const difficultyDistribution = {
      EASY: logs.filter(l => l.difficulty === 'EASY').length,
      MEDIUM: logs.filter(l => l.difficulty === 'MEDIUM').length,
      HARD: logs.filter(l => l.difficulty === 'HARD').length
    };

    return sendSuccess(res, {
      logs,
      stats: {
        totalCount,
        avgQuestions,
        difficultyDistribution
      }
    });
  } catch (error: any) {
    console.error('getQuizMetadataHandler Error:', error);
    return sendError(res, error.message || 'Failed to fetch quiz generation metadata');
  }
};

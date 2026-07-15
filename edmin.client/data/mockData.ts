
import { UserRole } from "@/types/types";

// Types
export interface Assignment {
    id: string;
    title: string;
    course: string;
    code: string;
    description?: string;
    dueDate: string;
    submissions: number;
    totalStudents: number;
    points?: number;
    status: 'Active' | 'Draft' | 'Grading' | 'Completed';
    courseId: string;
    allowLateSubmissions?: boolean;
    attachments?: { name: string; size: string }[];
}

// Initial Mock Data
export const initialAssignments: Assignment[] = [
    {
        id: '1',
        title: 'Midterm Project Proposal',
        course: 'Computer Science',
        code: 'CS-101',
        description: `Please submit a detailed proposal for your midterm project.

The proposal should include:
- Project Title
- Problem Statement
- Proposed Solution
- Technology Stack
- Timeline

Make sure to format your document according to the IEEE standards.`,
        dueDate: '2025-11-20',
        submissions: 38,
        totalStudents: 45,
        points: 100,
        status: 'Active',
        courseId: 'computer-science', // Matches courseId in URL
        allowLateSubmissions: true,
        attachments: [
            { name: 'Proposal_Template.docx', size: '2.4 MB' },
            { name: 'IEEE_Format_Guide.pdf', size: '1.1 MB' }
        ]
    },
    {
        id: '2',
        title: 'Algorithm Analysis Report',
        course: 'Computer Science',
        code: 'CS-101',
        description: 'Analyze the time and space complexity of the provided algorithms.',
        dueDate: '2025-12-05',
        submissions: 12,
        totalStudents: 45,
        points: 50,
        status: 'Active',
        courseId: 'computer-science',
        allowLateSubmissions: false,
        attachments: []
    },
    {
        id: 'a1', // Keeping legacy ID for now if needed, but ideally standardized
        title: 'Cloud Service Provider Comparison',
        course: 'Computer Science',
        code: 'CS-101',
        description: 'Compare AWS, Azure, and Google Cloud Platform services.',
        dueDate: '2025-11-20',
        submissions: 38,
        totalStudents: 45,
        points: 100,
        status: 'Active',
        courseId: 'computer-science',
        allowLateSubmissions: true,
        attachments: []
    },
    {
        id: 'a2',
        title: 'Database Normalization',
        course: 'Database Systems',
        code: 'CS-301',
        description: 'Normalize the given database schema to 3NF.',
        dueDate: '2025-11-25',
        submissions: 12,
        totalStudents: 38,
        points: 75,
        status: 'Active',
        courseId: 'database-systems',
        allowLateSubmissions: true,
        attachments: []
    },
    {
        id: 'a3',
        title: 'React Components Assignment',
        course: 'Web Development',
        code: 'CS-350',
        description: 'Build a reusable component library.',
        dueDate: '2025-11-15',
        submissions: 52,
        totalStudents: 55,
        points: 100,
        status: 'Grading',
        courseId: 'web-development',
        allowLateSubmissions: true,
        attachments: []
    }
];

// Quiz Types
export interface Quiz {
    id: string;
    title: string;
    course: string;
    code: string;
    description?: string;
    dueDate: string;
    duration: number; // in minutes
    totalQuestions: number;
    totalPoints: number;
    attempts: number;
    totalStudents: number;
    status: 'Active' | 'Draft' | 'Scheduled' | 'Completed' | 'Closed';
    courseId: string;
    allowMultipleAttempts?: boolean;
    passingScore?: number;
}

// Initial Mock Quizzes
export const initialQuizzes: Quiz[] = [
    {
        id: 'q1',
        title: 'Data Structures Fundamentals',
        course: 'Computer Science',
        code: 'CS-101',
        description: 'Quiz covering arrays, linked lists, stacks, and queues.',
        dueDate: '2025-11-22',
        duration: 45,
        totalQuestions: 20,
        totalPoints: 100,
        attempts: 35,
        totalStudents: 45,
        status: 'Active',
        courseId: 'computer-science',
        allowMultipleAttempts: false,
        passingScore: 60
    },
    {
        id: 'q2',
        title: 'Algorithm Complexity Quiz',
        course: 'Computer Science',
        code: 'CS-101',
        description: 'Test your understanding of Big O notation and algorithm analysis.',
        dueDate: '2025-12-10',
        duration: 30,
        totalQuestions: 15,
        totalPoints: 75,
        attempts: 8,
        totalStudents: 45,
        status: 'Active',
        courseId: 'computer-science',
        allowMultipleAttempts: true,
        passingScore: 50
    },
    {
        id: 'q3',
        title: 'SQL Queries and Joins',
        course: 'Database Systems',
        code: 'CS-301',
        description: 'Practice quiz on SELECT statements, JOINs, and subqueries.',
        dueDate: '2025-11-28',
        duration: 60,
        totalQuestions: 25,
        totalPoints: 100,
        attempts: 22,
        totalStudents: 38,
        status: 'Active',
        courseId: 'database-systems',
        allowMultipleAttempts: false,
        passingScore: 70
    },
    {
        id: 'q4',
        title: 'Database Normalization Quiz',
        course: 'Database Systems',
        code: 'CS-301',
        description: 'Quiz on 1NF, 2NF, 3NF, and BCNF.',
        dueDate: '2025-12-15',
        duration: 40,
        totalQuestions: 18,
        totalPoints: 90,
        attempts: 5,
        totalStudents: 38,
        status: 'Scheduled',
        courseId: 'database-systems',
        allowMultipleAttempts: false,
        passingScore: 65
    },
    {
        id: 'q5',
        title: 'React Hooks and State Management',
        course: 'Web Development',
        code: 'CS-350',
        description: 'Quiz covering useState, useEffect, useContext, and custom hooks.',
        dueDate: '2025-11-18',
        duration: 50,
        totalQuestions: 22,
        totalPoints: 110,
        attempts: 48,
        totalStudents: 55,
        status: 'Completed',
        courseId: 'web-development',
        allowMultipleAttempts: true,
        passingScore: 75
    },
    {
        id: 'q6',
        title: 'JavaScript ES6+ Features',
        course: 'Web Development',
        code: 'CS-350',
        description: 'Test on arrow functions, destructuring, spread operator, and async/await.',
        dueDate: '2025-12-01',
        duration: 35,
        totalQuestions: 16,
        totalPoints: 80,
        attempts: 12,
        totalStudents: 55,
        status: 'Active',
        courseId: 'web-development',
        allowMultipleAttempts: false,
        passingScore: 60
    }
];


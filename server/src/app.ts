import express, { Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import adminRoutes from './routes/v1/admin.routes.js';
import communicationsRoutes from './modules/communications/communications.routes.js';
import notificationRoutes from './modules/notifications/notification.routes.js';
import leaveRoutes from './routes/leaveRoutes.js';
import { NotificationService } from './modules/notifications/notification.service.js';
import enrollmentRoutes from './routes/enrollmentRoutes.js';
import teachingLoadRoutes from './routes/teachingLoadRoutes.js';
import activityReportRoutes from './routes/activityReportRoutes.js';
import configRoutes from './routes/configRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import facultyRoutes from './routes/v1/faculty.routes.js';
import studentRoutes from './routes/student/student.routes.js';
import aiQuizRoutes from './routes/aiQuizRoutes.js';
import academicChatRoutes from './modules/academic-chat/academic-chat.routes.js';
import complaintRoutes from './modules/complaint/complaint.routes.js';
import storageRoutes from './routes/v1/storage.routes.js';
import facultyAttendanceRoutes from './routes/v1/facultyAttendance.routes.js';
import { globalErrorHandler } from './middlewares/errorHandler.js';
import { globalLimiter } from './middlewares/rateLimit.js';

const app = express();

// Required for Render/Vercel load balancers so rate limits don't block everyone!
app.set('trust proxy', 1);

app.use(helmet());

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) || origin === process.env.CLIENT_URL) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(globalLimiter);

import crypto from 'crypto';
app.use((req, res, next) => {
  res.locals.requestId = req.headers['x-request-id'] || crypto.randomUUID();
  next();
});

// Response Time Logger (Disabled for Perf Testing)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    console.log(`[HTTP] ${req.method} ${req.originalUrl} - ${res.statusCode} [${ms}ms]`);
  });
  next();
});

// Initialize Event Subscribers
NotificationService.initializeEventListeners();


app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/communications', communicationsRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/leaves', leaveRoutes);
app.use('/api/v1/enrollment', enrollmentRoutes);
app.use('/api/v1/faculty/teaching-loads', teachingLoadRoutes);
app.use('/api/v1/faculty', facultyRoutes);
app.use('/api/v1/activity-reports', activityReportRoutes);
app.use('/api/v1/config', configRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/student', studentRoutes);
app.use('/api/v1/ai-quiz', aiQuizRoutes);
app.use('/api/v1/storage', storageRoutes);
app.use('/api/v1/complaints', complaintRoutes);
app.use('/api/v1/academic-chat', academicChatRoutes);
app.use('/api/faculty-attendance', facultyAttendanceRoutes);
app.use('/api/v1/faculty-attendance', facultyAttendanceRoutes);
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'Edmin Backend is running on TypeScript (MVC)' });
});

// Centralized Error Handling Middleware
app.use(globalErrorHandler);

export default app;

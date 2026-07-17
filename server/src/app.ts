import express, { Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import adminRoutes from './routes/v1/admin.routes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import leaveRoutes from './routes/leaveRoutes.js';
import enrollmentRoutes from './routes/enrollmentRoutes.js';
import teachingLoadRoutes from './routes/teachingLoadRoutes.js';
import activityReportRoutes from './routes/activityReportRoutes.js';
import configRoutes from './routes/configRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import facultyRoutes from './routes/v1/faculty.routes.js';
import studentRoutes from './routes/student/student.routes.js';
import aiQuizRoutes from './routes/aiQuizRoutes.js';
import storageRoutes from './routes/v1/storage.routes.js';
import { globalErrorHandler } from './middlewares/errorHandler.js';
import { setupNotificationSubscribers } from './events/notificationSubscribers.js';
import { globalLimiter } from './middlewares/rateLimit.js';

const app = express();

app.use(helmet());

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(globalLimiter);

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
setupNotificationSubscribers();


app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/v1/admin', adminRoutes);
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
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'Edmin Backend is running on TypeScript (MVC)' });
});

// Centralized Error Handling Middleware
app.use(globalErrorHandler);

export default app;

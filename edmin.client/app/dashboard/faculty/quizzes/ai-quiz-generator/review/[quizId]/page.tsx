'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { UserRole } from '@/types/types';
import {
  Home, ArrowLeft, Eye, Users, Send, Check, X, Loader2,
  ClipboardList, Award, AlertTriangle, Clock, RefreshCw, ChevronDown,
  FileDown, Trash2, Sparkles
} from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { apiGet, apiPost, apiPut, apiDelete } from '@/api/apiContract';
import toast, { Toaster } from 'react-hot-toast';
import type { AIQuiz, AIQuizAttempt } from '@/types/quiz';
import AdminPageHeader from '@/components/admin/AdminPageHeader';

type Tab = 'questions' | 'grades';

export default function AIQuizReviewPage() {
  const params = useParams();
  const quizId = Number(params.quizId);

  const [quiz, setQuiz] = useState<AIQuiz | null>(null);
  const [attempts, setAttempts] = useState<AIQuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('questions');
  const [publishing, setPublishing] = useState(false);
  const router = useRouter();
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [deletingQuiz, setDeletingQuiz] = useState(false);

  // Reattempt modal
  const [reattemptModal, setReattemptModal] = useState<{ open: boolean; studentId: number | null; studentName: string }>({
    open: false, studentId: null, studentName: ''
  });
  const [reattemptReason, setReattemptReason] = useState('');

  useEffect(() => {
    loadData();
  }, [quizId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [quizData, attemptsData] = await Promise.all([
        apiGet<AIQuiz>(`/ai-quiz/${quizId}`),
        apiGet<AIQuizAttempt[]>(`/ai-quiz/${quizId}/attempts`).catch(() => []),
      ]);
      setQuiz(quizData);
      setAttempts(attemptsData);
    } catch (err: any) {
      toast.error('Failed to load quiz data');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      await apiPut(`/ai-quiz/${quizId}/status`, { status: 'PUBLISHED' });
      toast.success('Quiz published!');
      loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to publish');
    } finally {
      setPublishing(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!quiz?.aiquizid) return;
    try {
      setDownloadingPdf(true);
      const res = await apiGet<{ url: string; expiresIn: number }>(`/storage/quiz-pdf/${quiz.aiquizid}`);
      if (res.url) {
        window.open(res.url, '_blank');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to download PDF');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDeleteQuiz = async () => {
    if (!window.confirm("Are you sure you want to delete this quiz? This action cannot be undone.")) return;
    try {
      setDeletingQuiz(true);
      await apiDelete(`/ai-quiz/${quizId}`);
      toast.success('Quiz deleted successfully');
      router.push('/dashboard/faculty/ai-quiz');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete quiz');
      setDeletingQuiz(false);
    }
  };

  const handleGrantReattempt = async () => {
    if (!reattemptModal.studentId) return;
    try {
      await apiPost(`/ai-quiz/${quizId}/reattempt`, {
        studentId: reattemptModal.studentId,
        reason: reattemptReason,
      });
      toast.success(`Reattempt granted to ${reattemptModal.studentName}`);
      setReattemptModal({ open: false, studentId: null, studentName: '' });
      setReattemptReason('');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to grant reattempt');
    }
  };

  const difficultyColors: Record<string, string> = {
    EASY: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    MEDIUM: 'bg-amber-50 text-amber-700 border-amber-200',
    HARD: 'bg-red-50 text-red-700 border-red-200',
  };

  const statusColors: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-600',
    PUBLISHED: 'bg-emerald-50 text-emerald-700',
    ARCHIVED: 'bg-red-50 text-red-600',
  };

  const attemptStatusColors: Record<string, string> = {
    IN_PROGRESS: 'bg-blue-50 text-blue-700',
    SUBMITTED: 'bg-emerald-50 text-emerald-700',
    AUTO_SUBMITTED: 'bg-amber-50 text-amber-700',
  };

  if (loading) {
    return (
      <DashboardLayout userRole={UserRole.FACULTY} userName="Faculty" notifications={[]} currentPath="/dashboard/faculty/ai-quiz">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        </div>
      </DashboardLayout>
    );
  }

  if (!quiz) {
    return (
      <DashboardLayout userRole={UserRole.FACULTY} userName="Faculty" notifications={[]} currentPath="/dashboard/faculty/ai-quiz">
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <p className="text-text-secondary">Quiz not found.</p>
          <Link href="/dashboard/faculty/ai-quiz" className="text-purple-600 hover:underline mt-2 inline-block">← Back to AI Quiz</Link>
        </div>
      </DashboardLayout>
    );
  }

  // Stats
  const totalAttempts = attempts.length;
  const completedAttempts = attempts.filter(a => a.status !== 'IN_PROGRESS');
  const avgScore = completedAttempts.length > 0
    ? completedAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / completedAttempts.length
    : 0;
  const highestScore = completedAttempts.length > 0
    ? Math.max(...completedAttempts.map(a => a.score || 0))
    : 0;

  return (
    <DashboardLayout userRole={UserRole.FACULTY} userName="Faculty" notifications={[]} currentPath="/dashboard/faculty/ai-quiz">
      <Toaster position="top-right" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminPageHeader
          icon={Sparkles}
          title={quiz.title}
          titleAccent="Review"
          subtitle={quiz.description || "Review AI generated quiz"}
          eyebrow={{ icon: Home, label: "AI Quiz Generator" }}
          backHref="/dashboard/faculty/ai-quiz"
          actions={
            <div className="flex flex-wrap gap-2 items-center">
              {quiz.pdfurl && (
                <button
                  onClick={handleDownloadPdf} disabled={downloadingPdf}
                  className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-[2px] text-sm text-text-secondary hover:bg-surface-hover transition-colors disabled:opacity-50"
                >
                  {downloadingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                  PDF
                </button>
              )}
              {quiz.status !== 'PUBLISHED' && (
                <button
                  onClick={handleDeleteQuiz} disabled={deletingQuiz}
                  className="flex items-center gap-1.5 px-3 py-2 border border-error-bg bg-error-bg/10 text-error-text rounded-[2px] text-sm hover:bg-error-bg hover:text-white transition-colors disabled:opacity-50"
                >
                  {deletingQuiz ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Delete
                </button>
              )}
              {quiz.status === 'DRAFT' && (
                <button
                  onClick={handlePublish} disabled={publishing}
                  className="flex items-center gap-1.5 px-4 py-2 bg-success-text hover:bg-success-text/90 text-white text-sm rounded-[2px] font-medium transition-colors disabled:opacity-50"
                >
                  {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Publish
                </button>
              )}
              <button onClick={loadData} className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-[2px] text-sm text-text-secondary hover:bg-surface-hover transition-colors">
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
            </div>
          }
        />

        {/* Quiz Meta Info */}
        <div className="bg-surface rounded-[2px] border border-border p-4 mb-6 flex flex-wrap gap-4 items-center text-sm text-text-secondary">
            <span className={`text-xs px-2 py-0.5 rounded font-medium ${statusColors[quiz.status]}`}>{quiz.status}</span>
            <span className={`text-xs px-2 py-0.5 rounded border font-medium ${difficultyColors[quiz.difficulty]}`}>{quiz.difficulty}</span>
            <span className="text-xs px-2 py-0.5 rounded bg-surface-hover text-text-secondary">{quiz.questiontype}</span>
            <div className="w-px h-4 bg-border hidden sm:block"></div>
            <span className="flex items-center gap-1"><ClipboardList className="w-4 h-4" /> {quiz.questioncount} questions</span>
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {quiz.timelimitminutes} min</span>
            <span className="flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> {quiz.maxwarnings} warnings</span>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-surface rounded-[2px] border border-border p-4">
            <div className="text-2xl font-bold text-purple-600">{totalAttempts}</div>
            <div className="text-xs text-text-secondary mt-1">Total Attempts</div>
          </div>
          <div className="bg-surface rounded-[2px] border border-border p-4">
            <div className="text-2xl font-bold text-emerald-600">{completedAttempts.length}</div>
            <div className="text-xs text-text-secondary mt-1">Completed</div>
          </div>
          <div className="bg-surface rounded-[2px] border border-border p-4">
            <div className="text-2xl font-bold text-blue-600">{avgScore.toFixed(1)}%</div>
            <div className="text-xs text-text-secondary mt-1">Avg Score</div>
          </div>
          <div className="bg-surface rounded-[2px] border border-border p-4">
            <div className="text-2xl font-bold text-amber-600">{highestScore.toFixed(1)}%</div>
            <div className="text-xs text-text-secondary mt-1">Highest Score</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-surface rounded-[2px] border border-border overflow-hidden">
          <div className="flex border-b border-border">
            <button
              onClick={() => setActiveTab('questions')}
              className={`px-5 py-3 text-sm font-medium transition-colors relative ${
                activeTab === 'questions' ? 'text-purple-600' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Eye className="w-4 h-4 inline mr-1.5" /> Questions ({quiz.questions?.length || 0})
              {activeTab === 'questions' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-600"></div>}
            </button>
            <button
              onClick={() => setActiveTab('grades')}
              className={`px-5 py-3 text-sm font-medium transition-colors relative ${
                activeTab === 'grades' ? 'text-purple-600' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Users className="w-4 h-4 inline mr-1.5" /> Student Grades ({attempts.length})
              {activeTab === 'grades' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-600"></div>}
            </button>
          </div>

          {/* Questions Tab */}
          {activeTab === 'questions' && (
            <div className="p-6 space-y-4">
              {quiz.questions && quiz.questions.length > 0 ? quiz.questions.map((q, i) => (
                <div key={q.aiquizquestionid} className="border border-border rounded-[2px] p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center text-xs font-bold">
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-text-primary text-sm">{q.questiontext}</p>
                      {Array.isArray(q.options) && q.options.length > 0 && (
                        <div className="mt-2 space-y-1.5">
                          {(q.options as string[]).map((opt: string, j: number) => (
                            <div key={j} className={`flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-[2px] border ${
                              opt === q.correctanswer
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                : 'bg-gray-50 border-gray-200 text-text-primary'
                            }`}>
                              {opt === q.correctanswer ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <div className="w-3.5 h-3.5 rounded-full border border-gray-300"></div>}
                              {opt}
                            </div>
                          ))}
                        </div>
                      )}
                      {q.type === 'SHORT_ANSWER' && (
                        <div className="mt-2 px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded-[2px] text-xs text-emerald-800">
                          <span className="font-medium">Answer:</span> {q.correctanswer}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )) : (
                <p className="text-center text-sm text-text-secondary py-8">No questions found.</p>
              )}
            </div>
          )}

          {/* Grades Tab */}
          {activeTab === 'grades' && (
            <div className="overflow-x-auto">
              {attempts.length > 0 ? (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-border">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-text-secondary">Student</th>
                      <th className="text-left px-4 py-3 font-medium text-text-secondary">Roll No</th>
                      <th className="text-left px-4 py-3 font-medium text-text-secondary">Status</th>
                      <th className="text-left px-4 py-3 font-medium text-text-secondary">Score</th>
                      <th className="text-left px-4 py-3 font-medium text-text-secondary">Violations</th>
                      <th className="text-left px-4 py-3 font-medium text-text-secondary">Submitted</th>
                      <th className="text-left px-4 py-3 font-medium text-text-secondary">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDEBE9]">
                    {attempts.map((attempt) => (
                      <tr key={attempt.aiquizattemptid} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-text-primary">
                          {attempt.student?.fullname || 'Unknown'}
                        </td>
                        <td className="px-4 py-3 text-text-secondary">
                          {attempt.student?.rollnumber || '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded font-medium ${attemptStatusColors[attempt.status]}`}>
                            {attempt.status === 'AUTO_SUBMITTED' ? 'Auto-Sub' : attempt.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {attempt.score !== null ? (
                            <span className={`font-semibold ${
                              (attempt.score || 0) >= 70 ? 'text-emerald-600' :
                              (attempt.score || 0) >= 50 ? 'text-amber-600' : 'text-red-600'
                            }`}>
                              {attempt.score?.toFixed(1)}%
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          {attempt.violationcount > 0 ? (
                            <span className="flex items-center gap-1 text-amber-600">
                              <AlertTriangle className="w-3.5 h-3.5" /> {attempt.violationcount}
                            </span>
                          ) : (
                            <span className="text-emerald-600 text-xs">Clean</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-text-secondary text-xs">
                          {attempt.submittedat ? new Date(attempt.submittedat).toLocaleString() : 'In Progress'}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setReattemptModal({
                              open: true,
                              studentId: attempt.student?.studentid || null,
                              studentName: attempt.student?.fullname || 'Student'
                            })}
                            className="text-xs text-purple-600 hover:text-purple-800 font-medium"
                          >
                            Grant Reattempt
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-sm text-text-secondary">
                  No student attempts yet.{quiz.status === 'DRAFT' && ' Publish the quiz to allow students to take it.'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Reattempt Modal */}
      {reattemptModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-surface rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-text-primary mb-2">Grant Reattempt</h3>
            <p className="text-sm text-text-secondary mb-4">
              Allow <span className="font-medium">{reattemptModal.studentName}</span> to retake this quiz.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-primary mb-1">Reason (optional)</label>
              <textarea
                value={reattemptReason}
                onChange={(e) => setReattemptReason(e.target.value)}
                className="w-full border border-border rounded-[2px] px-3 py-2 text-sm resize-none outline-none focus:ring-2 focus:ring-purple-500"
                rows={3}
                placeholder="e.g. Technical issues during the quiz"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setReattemptModal({ open: false, studentId: null, studentName: '' }); setReattemptReason(''); }}
                className="px-4 py-2 text-sm text-text-secondary border border-border rounded-[2px] hover:bg-gray-50"
              >
                Cancel
              </button>
              <button onClick={handleGrantReattempt} className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-[2px] font-medium">
                Grant Reattempt
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

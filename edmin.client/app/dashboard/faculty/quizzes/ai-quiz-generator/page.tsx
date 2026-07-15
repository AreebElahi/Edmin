"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { UserRole } from '@/types/types';
import { Sparkles, FileText, UploadCloud, CheckCircle2, Loader2, AlertCircle, RefreshCw, Check } from 'lucide-react';
import { ActionButton, SectionCard } from '@/components/ui/Primitives';
import { apiClient } from '@/api/apiClient';

export default function AIQuizGenPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [courseOfferingId, setCourseOfferingId] = useState<string>('');
  
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [questionType, setQuestionType] = useState('MCQ');
  const [topic, setTopic] = useState('');
  
  const [timeLimit, setTimeLimit] = useState<number>(30);
  const [maxWarnings, setMaxWarnings] = useState<number>(3);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [generatedQuiz, setGeneratedQuiz] = useState<any>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await apiClient.get('/faculty/courses');
        const data = res.data;
        if (data && data.success && data.data) {
          setCourses(data.data);
          if (data.data.length > 0) {
            setCourseOfferingId(data.data[0].courseofferingid.toString());
          }
        }
      } catch (err) {
        console.error("Failed to load courses", err);
      }
    };
    fetchCourses();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) {
      setError('Please provide a title and upload a PDF.');
      return;
    }
    
    setError(null);
    setIsGenerating(true);
    
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('pdf', file);
      formData.append('questionCount', String(questionCount));
      formData.append('difficulty', difficulty);
      formData.append('questionType', questionType);
      formData.append('topic', topic || title);
      
      const res: any = await apiClient.post('/ai-quiz/generate', formData, {
        headers: { 'Content-Type': undefined }
      });
      
      if (res.success && res.data) {
        setGeneratedQuiz(res.data);
      } else {
        setError('Generation failed.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during generation.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async (status: 'DRAFT' | 'PUBLISHED') => {
    if (!generatedQuiz) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      const payload = {
        ...generatedQuiz,
        status,
        timeLimitMinutes: timeLimit,
        maxWarnings: maxWarnings,
        courseOfferingId: courseOfferingId ? Number(courseOfferingId) : undefined,
      };
      
      const res: any = await apiClient.post('/ai-quiz/save', payload);
      
      if (res.success) {
        alert(`Quiz saved successfully as ${status}!`);
        // Reset state
        setGeneratedQuiz(null);
        setFile(null);
        setTitle('');
      } else {
        setError('Save failed.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout
      userRole={UserRole.FACULTY}
      userName="Faculty"
      notifications={[]}
      currentPath="/dashboard/faculty/ai-quiz"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {!generatedQuiz ? (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-purple-600" />
                AI Quiz Generator
              </h1>
              <p className="text-sm text-text-secondary mt-1">Upload your course materials and let AI instantly create a secure quiz.</p>
            </div>

            <SectionCard>
              <form onSubmit={handleGenerate} className="space-y-6">
                
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}

                {/* PDF Upload */}
                <div>
                  <label className="block text-sm font-semibold text-text-primary mb-1">Source Material (PDF)</label>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border hover:border-purple-300 hover:bg-purple-50 transition-colors rounded-[2px] cursor-pointer">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <UploadCloud className="w-8 h-8 text-text-muted mb-2" />
                      <p className="text-sm text-text-secondary">
                        {file ? <span className="font-semibold text-purple-600">{file.name}</span> : <span>Click to upload or drag and drop</span>}
                      </p>
                    </div>
                    <input type="file" className="hidden" accept=".pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-text-primary mb-1">Quiz Title</label>
                    <input type="text" className="w-full border border-border rounded-[2px] px-3 py-2 text-sm focus:outline-none focus:border-purple-500" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Midterm Setup Quiz" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-text-primary mb-1">Course (Optional)</label>
                    <select className="w-full border border-border rounded-[2px] px-3 py-2 text-sm focus:outline-none focus:border-purple-500" value={courseOfferingId} onChange={(e) => setCourseOfferingId(e.target.value)}>
                      <option value="">Select a course...</option>
                      {courses.map(c => (
                        <option key={c.courseofferingid} value={c.courseofferingid}>
                          {c.course?.code} - {c.course?.name} ({c.section})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-text-primary mb-1">Topic Focus (Optional)</label>
                    <input type="text" className="w-full border border-border rounded-[2px] px-3 py-2 text-sm focus:outline-none focus:border-purple-500" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Chapter 4: Photosynthesis" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-text-primary mb-1">Difficulty</label>
                    <select className="w-full border border-border rounded-[2px] px-3 py-2 text-sm focus:outline-none focus:border-purple-500" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                      <option value="EASY">Easy</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HARD">Hard</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-text-primary mb-1">Number of Questions</label>
                    <input type="number" min="1" max="50" className="w-full border border-border rounded-[2px] px-3 py-2 text-sm focus:outline-none focus:border-purple-500" value={questionCount} onChange={(e) => setQuestionCount(Number(e.target.value))} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-text-primary mb-1">Question Type</label>
                    <select className="w-full border border-border rounded-[2px] px-3 py-2 text-sm focus:outline-none focus:border-purple-500" value={questionType} onChange={(e) => setQuestionType(e.target.value)}>
                      <option value="MCQ">Multiple Choice</option>
                      <option value="TRUE_FALSE">True / False</option>
                      <option value="SHORT_ANSWER">Short Answer</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-text-primary mb-1">Time Limit (Minutes)</label>
                    <input type="number" min="1" className="w-full border border-border rounded-[2px] px-3 py-2 text-sm focus:outline-none focus:border-purple-500" value={timeLimit} onChange={(e) => setTimeLimit(Number(e.target.value))} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-text-primary mb-1">Max Warnings (Anti-Cheat)</label>
                    <input type="number" min="1" max="10" className="w-full border border-border rounded-[2px] px-3 py-2 text-sm focus:outline-none focus:border-purple-500" value={maxWarnings} onChange={(e) => setMaxWarnings(Number(e.target.value))} />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <ActionButton type="submit" variant="primary" disabled={isGenerating}>
                    {isGenerating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4" /> Generate Quiz</>}
                  </ActionButton>
                </div>
              </form>
            </SectionCard>
          </>
        ) : (
          <div className="animate-in fade-in duration-300">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-text-primary">Review Generated Quiz</h1>
                <p className="text-sm text-text-secondary mt-1">Check the questions below. If you are satisfied, publish the quiz.</p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <SectionCard title={generatedQuiz.title} subtitle={generatedQuiz.topic ? `Topic: ${generatedQuiz.topic}` : ''} className="mb-6">
              <div className="space-y-6">
                {generatedQuiz.questions?.map((q: any, i: number) => (
                  <div key={i} className="p-4 border border-border bg-[#FAFAFA] rounded-[2px]">
                    <p className="font-semibold text-sm mb-3"><span className="text-primary mr-2">Q{i + 1}.</span>{q.questiontext || q.questionText}</p>
                    
                    {q.options && q.options.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                        {q.options.map((opt: string, optIdx: number) => {
                          const isCorrect = q.correctanswer === opt || q.correctAnswer === opt || q.correctAnswerIndex === optIdx || String(q.correctAnswer) === String(optIdx);
                          return (
                            <div key={optIdx} className={`p-2 text-sm border rounded-[2px] ${isCorrect ? 'bg-green-50 border-green-200 font-semibold text-green-800' : 'bg-surface border-border text-text-secondary'}`}>
                              {opt} {isCorrect && <CheckCircle2 className="w-3 h-3 inline ml-1 text-green-600" />}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {(!q.options || q.options.length === 0) && (
                      <div className="mt-2 p-3 bg-surface border border-border rounded-[2px] text-sm text-text-primary">
                        <strong>Correct Answer/Key:</strong> {q.correctanswer || q.correctAnswerText || q.correctAnswer || 'N/A'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </SectionCard>

            <div className="flex justify-between items-center bg-surface p-4 border border-border rounded-[2px] sticky bottom-4 shadow-sm">
              <ActionButton variant="secondary" onClick={() => setGeneratedQuiz(null)} disabled={isSaving}>
                Discard
              </ActionButton>
              
              <div className="flex gap-2">
                <ActionButton variant="secondary" onClick={() => handleSave('DRAFT')} disabled={isSaving}>
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save as Draft'}
                </ActionButton>
                <ActionButton variant="primary" onClick={() => handleSave('PUBLISHED')} disabled={isSaving}>
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" /> Publish Now</>}
                </ActionButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

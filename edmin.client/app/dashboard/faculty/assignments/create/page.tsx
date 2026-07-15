'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { UserRole, Notification } from '@/types/types';
import { FileText, Save, X, Upload, Calendar, BookOpen, AlertCircle, Home, CheckCircle2, ChevronDown } from 'lucide-react';
import Modal from '@/components/Modal';
import Link from 'next/link';
import { useState, Suspense, useRef } from 'react';
import { toast } from 'sonner';

import { useSearchParams, useRouter } from 'next/navigation';
import { apiPost } from '@/api/apiContract';

import { DashboardAPI } from '@/utils/api';
import { useEffect } from 'react';

function CreateAssignmentContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const preSelectedCourseId = searchParams.get('courseId');
    const fromCourse = searchParams.get('from');
    const courseName = searchParams.get('courseName');
    const [title, setTitle] = useState('');
    const [selectedCourseId, setSelectedCourseId] = useState(preSelectedCourseId || '');
    const [dueDate, setDueDate] = useState('');
    const [maxMarks, setMaxMarks] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [profile, setProfile] = useState<any>(null);

    useEffect(() => {
        DashboardAPI.getFacultyDashboard().then(res => setProfile(res.profile)).catch(console.error);
    }, []);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setSelectedFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const triggerFileUpload = () => {
        fileInputRef.current?.click();
    };

    const handleCreate = async () => {
        if (!title.trim()) {
            toast.error('Please enter an assignment title');
            return;
        }
        
        const finalCourseId = fromCourse || selectedCourseId;
        if (!finalCourseId) {
            toast.error('Please select a course');
            return;
        }

        if (!dueDate || !maxMarks) {
            toast.error('Please fill out schedule and grading details');
            return;
        }

        try {
            const data = await apiPost('/faculty/assignments', {
                courseOfferingId: finalCourseId,
                title,
                maxMarks: parseFloat(maxMarks),
                dueDate: new Date(dueDate).toISOString()
            });
            toast.success('Assignment created successfully');
            setTimeout(() => {
                router.push('/dashboard/faculty/assignments');
            }, 500);
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || 'Failed to create assignment');
        }
    };

    return (
        <DashboardLayout
            userRole={UserRole.FACULTY}
            userName={profile?.fullname || 'Faculty'}
            userAvatar={profile?.avatar}
            notifications={[]}
            currentPath="/dashboard/faculty/assignments"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Breadcrumb */}
                <nav className="flex mb-6" aria-label="Breadcrumb">
                    <ol className="flex items-center space-x-2 bg-surface px-3 py-2 rounded-[2px] border border-border shadow-none">
                        <li>
                            <Link href="/dashboard/faculty" className="text-text-secondary hover:text-primary transition-colors">
                                <Home className="w-4 h-4" />
                            </Link>
                        </li>
                        <li><span className="text-border-hover">/</span></li>

                        {fromCourse && courseName ? (
                            <>
                                <li>
                                    <Link href="/dashboard/faculty/courses" className="text-sm font-medium text-text-secondary hover:text-primary transition-colors">
                                        My Courses
                                    </Link>
                                </li>
                                <li><span className="text-border-hover">/</span></li>
                                <li>
                                    <Link href={`/dashboard/faculty/courses/${fromCourse}`} className="text-sm font-medium text-text-secondary hover:text-primary transition-colors">
                                        {courseName}
                                    </Link>
                                </li>
                                <li><span className="text-border-hover">/</span></li>
                                <li><span className="text-sm font-medium text-text-primary">Create Assignment</span></li>
                            </>
                        ) : (
                            <>
                                <li>
                                    <Link href="/dashboard/faculty/assignments" className="text-sm font-medium text-text-secondary hover:text-primary transition-colors">
                                        Assignments
                                    </Link>
                                </li>
                                <li><span className="text-border-hover">/</span></li>
                                <li><span className="text-sm font-medium text-text-primary">Create</span></li>
                            </>
                        )}
                    </ol>
                </nav>

                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-text-primary">Create New Assignment</h1>
                    <Link href="/dashboard/faculty/assignments">
                        <button className="p-2 text-text-muted hover:text-text-primary hover:bg-background rounded-[2px] transition-colors">
                            <X className="h-6 w-6" />
                        </button>
                    </Link>
                </div>

                <div className="bg-surface rounded-[2px] shadow-none border border-border p-6 md:p-8 space-y-6">
                    {/* General Information */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                            <FileText className="h-5 w-5 text-blue-500" />
                            Assignment Details
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-text-primary">Assignment Title</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Midterm Project Proposal"
                                    className="w-full px-4 py-2.5 rounded-[2px] border border-border focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-text-primary">Course</label>
                                {fromCourse ? (
                                    <div className="relative">
                                        <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
                                        <input
                                            type="text"
                                            value={courseName || fromCourse} // Fallback to ID if name is missing
                                            readOnly
                                            className="w-full pl-10 pr-4 py-2.5 rounded-[2px] border border-border bg-background text-text-secondary cursor-not-allowed outline-none focus:ring-0"
                                        />
                                        <input type="hidden" value={fromCourse} name="courseId" />
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
                                        <select
                                            value={selectedCourseId}
                                            onChange={(e) => setSelectedCourseId(e.target.value)}
                                            className="w-full pl-10 pr-10 py-2.5 rounded-[2px] border border-border focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all appearance-none bg-surface cursor-pointer"
                                        >
                                            <option value="" disabled>Select a course offering ID</option>
                                            <option value="1">Course Offering 1</option>
                                            <option value="2">Course Offering 2</option>
                                            <option value="3">Course Offering 3</option>
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted pointer-events-none" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-text-primary">Description</label>
                        <textarea
                            rows={5}
                            placeholder="Enter detailed instructions for the assignment..."
                            className="w-full px-4 py-3 rounded-[2px] border border-border focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none"
                        ></textarea>
                        <p className="text-xs text-text-secondary text-right">Markdown supported</p>
                    </div>


                    <hr className="border-border" />

                    {/* Settings */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-indigo-500" />
                            Schedule & Grading
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-text-primary">Due Date</label>
                                <input
                                    type="datetime-local"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-[2px] border border-border focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-text-primary">Points</label>
                                <input
                                    type="number"
                                    placeholder="100"
                                    value={maxMarks}
                                    onChange={(e) => setMaxMarks(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-[2px] border border-border focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                />
                            </div>
                            <div className="flex items-center pt-8">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" className="w-5 h-5 rounded text-primary focus:ring-blue-500 border-gray-300" />
                                    <span className="text-sm text-text-primary font-medium">Allow Late Submissions</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <hr className="border-border" />

                    {/* Attachments */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                            <Upload className="h-5 w-5 text-sky-500" />
                            Resources & Attachments
                        </h2>

                        <div
                            className={`border-2 border-dashed rounded-[2px] p-8 text-center transition-all cursor-pointer ${isDragging
                                ? 'border-blue-500 bg-primary-light'
                                : 'border-border hover:border-blue-400 hover:bg-background'
                                }`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={triggerFileUpload}
                        >
                            <div className="w-12 h-12 bg-primary-light text-primary rounded-[2px] flex items-center justify-center mx-auto mb-3">
                                <Upload className="h-6 w-6" />
                            </div>
                            {selectedFile ? (
                                <div>
                                    <h3 className="text-text-primary font-medium">{selectedFile.name}</h3>
                                    <p className="text-sm text-text-secondary mt-1">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                    <p className="text-xs text-primary mt-2 hover:underline">Click to change file</p>
                                </div>
                            ) : (
                                <div>
                                    <h3 className="text-text-primary font-medium">Click to upload or drag and drop</h3>
                                    <p className="text-sm text-text-secondary mt-1">PDF, DOCX, IMG or ZIP (max. 10MB)</p>
                                </div>
                            )}
                            <input
                                type="file"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 bg-surface-hover border border-border rounded-[2px] p-4 text-sm text-text-primary">
                        <AlertCircle className="h-5 w-5 flex-shrink-0 text-text-secondary" />
                        <p>This assignment will be visible to students enrolled in the selected course immediately after publishing.</p>
                    </div>

                    <div className="flex justify-end gap-3 pt-6">
                        <Link href="/dashboard/faculty/assignments">
                            <button className="px-6 py-2.5 rounded-[2px] border border-border font-semibold text-text-primary hover:bg-background transition-colors">
                                Cancel
                            </button>
                        </Link>
                        <button
                            onClick={handleCreate}
                            className="px-6 py-2.5 rounded-[2px] bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-none shadow-blue-200 hover:shadow-none hover:translate-y-[-1px] transition-all"
                        >
                            Create Assignment
                        </button>
                    </div>
                </div>

                <Modal
                    isOpen={isConfirmModalOpen}
                    onClose={() => setIsConfirmModalOpen(false)}
                    title="Confirm Creation"
                    type="default"
                >
                    <div className="text-center">
                        <p className="text-text-primary mb-6">
                            Are you sure you want to create the assignment <strong>{title}</strong>?
                            This will make it available to enrolled students.
                        </p>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => setIsConfirmModalOpen(false)}
                                className="px-5 py-2.5 rounded-[2px] border border-border font-semibold text-text-primary hover:bg-background transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    const formData = new FormData();
                                    formData.append('title', title);
                                    formData.append('courseId', fromCourse || selectedCourseId);
                                    formData.append('dueDate', dueDate);
                                    formData.append('maxMarks', maxMarks);
                                    if (selectedFile) formData.append('file', selectedFile);

                                    const result = await apiPost('/faculty/assignments', formData, { headers: { 'Content-Type': 'multipart/form-data' } } as any);
                                    if ((result as any).success) {
                                        setIsConfirmModalOpen(false);
                                        router.push('/dashboard/faculty/assignments');
                                    }
                                }}
                                className="px-5 py-2.5 rounded-[2px] bg-primary text-white font-semibold hover:bg-primary-hover shadow-none shadow-blue-200 transition-colors"
                            >
                                Confirm & Create
                            </button>
                        </div>
                    </div>
                </Modal>
            </div>
        </DashboardLayout >
    );
}

export default function CreateAssignmentPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CreateAssignmentContent />
        </Suspense>
    );
}

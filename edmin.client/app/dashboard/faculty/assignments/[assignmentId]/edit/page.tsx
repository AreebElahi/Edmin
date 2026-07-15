'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { UserRole, Notification } from '@/types/types';
import { FileText, Save, X, Upload, Calendar, BookOpen, AlertCircle, Home, MonitorCheck, ChevronDown, CheckCircle2 } from 'lucide-react';
import Modal from '@/components/Modal';
import Link from 'next/link';
import { useState, Suspense, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { useSearchParams, useRouter, useParams } from 'next/navigation';

import { DashboardAPI } from '@/utils/api';
import { apiGet, apiPatch } from '@/api/apiContract';

function EditAssignmentContent() {
    const params = useParams();
    const router = useRouter();
    const assignmentId = params.assignmentId;

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [courseId, setCourseId] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [points, setPoints] = useState(100);
    const [allowLate, setAllowLate] = useState(true);
    const [attachments, setAttachments] = useState<any[]>([]);

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [dash, assignmentsRes] = await Promise.all([
                    DashboardAPI.getFacultyDashboard(),
                    apiGet('/faculty/assignments')
                ]);
                setProfile(dash.profile);
                const allAssignments = (assignmentsRes as any)?.data || [];
                const found = allAssignments.find((a: any) => a.id === assignmentId);
                if (found) {
                    setTitle(found.title);
                    setDescription(found.description || '');
                    setCourseId(found.courseId || '');
                    if (found.dueDate) {
                        setDueDate(new Date(found.dueDate).toISOString().slice(0, 16));
                    }
                    setPoints(found.maxMarks || 100);
                    // allowLate and attachments are not in the schema, keep defaults
                } else {
                    toast.error('Assignment not found');
                }
            } catch (err) {
                console.error(err);
                toast.error('Failed to load assignment data');
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [assignmentId]);

    if (loading) {
        return (
            <DashboardLayout userName="Loading..." userRole={UserRole.FACULTY} notifications={[]} currentPath={`/dashboard/faculty/assignments/${assignmentId}/edit`}>
                <div className="flex justify-center items-center h-[60vh]">
                    <div className="w-6 h-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                </div>
            </DashboardLayout>
        );
    }

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

    const handleUpdate = () => {
        if (!title.trim()) {
            toast.error('Please enter an assignment title');
            return;
        }
        setIsConfirmModalOpen(true);
    };

    const confirmUpdate = async () => {
        setIsConfirmModalOpen(false);
        try {
            await apiPatch(`/faculty/assignments/${assignmentId}`, {
                title,
                maxMarks: parseFloat(points.toString()),
                dueDate: new Date(dueDate).toISOString()
            });
            toast.success('Assignment updated successfully');
            setTimeout(() => {
                router.push(`/dashboard/faculty/assignments/${assignmentId}`);
            }, 500);
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || 'Failed to update assignment');
        }
    };

    return (
        <DashboardLayout
            userRole={UserRole.FACULTY}
            userName={profile?.fullname || 'Faculty'}
            userAvatar={profile?.avatar}
            notifications={[]}
            currentPath={`/dashboard/faculty/assignments/${assignmentId}/edit`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Breadcrumb */}
                <nav className="flex mb-6" aria-label="Breadcrumb">
                    <ol className="flex items-center space-x-2 bg-surface px-3 py-2 rounded-[2px] border border-border ">
                        <li>
                            <Link href="/dashboard/faculty" className="text-text-secondary hover:text-primary transition-colors">
                                <Home className="w-4 h-4" />
                            </Link>
                        </li>
                        <li><span className="text-border-hover">/</span></li>
                        <li>
                            <Link href="/dashboard/faculty/assignments" className="text-sm font-medium text-text-secondary hover:text-primary transition-colors">
                                Assignments
                            </Link>
                        </li>
                        <li><span className="text-border-hover">/</span></li>
                        <li>
                            <Link href={`/dashboard/faculty/assignments/${assignmentId}`} className="text-sm font-medium text-text-secondary hover:text-primary transition-colors">
                                {title || 'Assignment'}
                            </Link>
                        </li>
                        <li><span className="text-border-hover">/</span></li>
                        <li><span className="text-sm font-medium text-text-primary">Edit</span></li>
                    </ol>
                </nav>

                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-text-primary">Edit Assignment</h1>
                    <Link href={`/dashboard/faculty/assignments/${assignmentId}`}>
                        <button className="p-2 text-text-muted hover:text-text-primary hover:bg-background rounded-[2px] transition-colors">
                            <X className="h-6 w-6" />
                        </button>
                    </Link>
                </div>

                <div className="bg-surface rounded-[2px]  border border-border p-6 md:p-8 space-y-6">
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
                                <div className="relative">
                                    <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
                                    <select
                                        value={courseId}
                                        onChange={(e) => setCourseId(e.target.value)}
                                        className="w-full pl-10 pr-10 py-2.5 rounded-[2px] border border-border focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all appearance-none bg-surface cursor-pointer"
                                    >
                                        <option value="" disabled>Select a course</option>
                                        <option value="cs-101">Computer Science (CS-101)</option>
                                        <option value="cs-301">Database Systems (CS-301)</option>
                                        <option value="cs-201">Data Structures (CS-201)</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-primary">Description</label>
                            <textarea
                                rows={5}
                                placeholder="Enter detailed instructions for the assignment..."
                                className="w-full px-4 py-3 rounded-[2px] border border-border focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            ></textarea>
                            <p className="text-xs text-text-secondary text-right">Markdown supported</p>
                        </div>
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
                                    className="w-full px-4 py-2.5 rounded-[2px] border border-border focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-text-primary">Points</label>
                                <input
                                    type="number"
                                    placeholder="100"
                                    className="w-full px-4 py-2.5 rounded-[2px] border border-border focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                    value={points}
                                    onChange={(e) => setPoints(Number(e.target.value))}
                                />
                            </div>
                            <div className="flex items-center pt-8">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5 rounded text-primary focus:ring-blue-500 border-gray-300"
                                        checked={allowLate}
                                        onChange={(e) => setAllowLate(e.target.checked)}
                                    />
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

                        <div className="space-y-3">
                            {attachments.map((file, index) => (
                                <div key={index} className="flex items-center justify-between p-3 rounded-[2px] border border-border hover:bg-background transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-primary-light text-primary rounded-[2px] flex items-center justify-center">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-text-primary group-hover:text-primary transition-colors">{file.name}</p>
                                            <p className="text-xs text-text-secondary">{file.size}</p>
                                        </div>
                                    </div>
                                    <button className="p-2 text-text-muted hover:text-error-text hover:bg-error-bg rounded-[2px] transition-colors" title="Remove attachment">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>

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
                        <p>Changes will be reflected immediately for all students.</p>
                    </div>

                    <div className="flex justify-end gap-3 pt-6">
                        <Link href={`/dashboard/faculty/assignments/${assignmentId}`}>
                            <button className="px-6 py-2.5 rounded-[2px] border border-border font-semibold text-text-primary hover:bg-background transition-colors">
                                Cancel
                            </button>
                        </Link>
                        <button
                            onClick={handleUpdate}
                            className="px-6 py-2.5 rounded-[2px] bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold  shadow-blue-200 hover: hover:translate-y-[-1px] transition-all flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            Save Changes
                        </button>
                    </div>
                </div>

                <Modal
                    isOpen={isConfirmModalOpen}
                    onClose={() => setIsConfirmModalOpen(false)}
                    title="Confirm Updates"
                    type="default"
                >
                    <div className="text-center">
                        <p className="text-text-primary mb-6">
                            Are you sure you want to update the assignment <strong>{title}</strong>?
                        </p>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => setIsConfirmModalOpen(false)}
                                className="px-5 py-2.5 rounded-[2px] border border-border font-semibold text-text-primary hover:bg-background transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmUpdate}
                                className="px-5 py-2.5 rounded-[2px] bg-primary text-white font-semibold hover:bg-primary-hover  shadow-blue-200 transition-colors"
                            >
                                Confirm & Update
                            </button>
                        </div>
                    </div>
                </Modal>
            </div>
        </DashboardLayout>
    );
}

export default function EditAssignmentPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <EditAssignmentContent />
        </Suspense>
    );
}

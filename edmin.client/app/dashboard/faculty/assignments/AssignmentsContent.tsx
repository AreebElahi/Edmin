'use client';

import DashboardLayout from '@/components/DashboardLayout';
import Modal from '@/components/Modal';
import { UserRole, Notification } from '@/types/types';
import { FileText, Plus, Search, Filter, Home, Calendar, Users, Eye, Edit, Trash2, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminFilterBar from '@/components/admin/AdminFilterBar';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { DashboardAPI, FacultyAPI } from '@/utils/api';
import { apiGet, apiDelete } from '@/api/apiContract';

export default function FacultyAssignmentsContent() {
    const searchParams = useSearchParams();
    const courseId = searchParams.get('courseId');

    const [assignments, setAssignments] = useState<any[]>([]);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [showComingSoon, setShowComingSoon] = useState(false);
    const [assignmentToDelete, setAssignmentToDelete] = useState<string | null>(null);

    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [allAssignments, setAllAssignments] = useState<any[]>([]);
    
    // Filtering state
    const [courses, setCourses] = useState<any[]>([]);
    const [searchValue, setSearchValue] = useState('');
    const [selectedCourseId, setSelectedCourseId] = useState<string>('all');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [dash, assignmentsRes, coursesRes] = await Promise.all([
                    DashboardAPI.getFacultyDashboard(),
                    apiGet('/faculty/assignments'),
                    FacultyAPI.getCourses()
                ]);
                setProfile(dash.profile);
                
                const fetchedCourses = Array.isArray(coursesRes) ? coursesRes : ((coursesRes as any)?.data || []);
                setCourses(fetchedCourses);

                const fetchedAssignments = Array.isArray(assignmentsRes) ? assignmentsRes : ((assignmentsRes as any)?.data || []);
                setAllAssignments(fetchedAssignments);
                
                if (courseId) {
                    setSelectedCourseId(courseId);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []); // Only fetch once on mount

    useEffect(() => {
        let filtered = allAssignments;

        if (searchValue) {
            filtered = filtered.filter(a => a.title?.toLowerCase().includes(searchValue.toLowerCase()));
        }

        if (selectedCourseId !== 'all') {
            filtered = filtered.filter(a => 
                a.courseofferingid?.toString() === selectedCourseId ||
                a.courseOfferingId?.toString() === selectedCourseId ||
                a.courseid?.toString() === selectedCourseId ||
                a.courseId?.toString() === selectedCourseId
            );
        }

        setAssignments(filtered);
    }, [searchValue, selectedCourseId, allAssignments]);

    const openDeleteModal = (id: string) => {
        setAssignmentToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const closeDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setAssignmentToDelete(null);
    };

    const handleDelete = async () => {
        if (assignmentToDelete) {
            try {
                await apiDelete(`/faculty/assignments/${assignmentToDelete}`);
                setAssignments(prev => prev.filter(a => a.id !== assignmentToDelete));
                closeDeleteModal();
            } catch (err) {
                console.error("Failed to delete assignment", err);
                alert("Failed to delete assignment. Please try again.");
            }
        }
    };

    if (loading) {
        return (
            <DashboardLayout userName="Loading..." userRole={UserRole.FACULTY} notifications={[]} currentPath="/dashboard/faculty/assignments">
                <div className="flex justify-center items-center h-[60vh]">
                    <div className="w-6 h-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            userRole={UserRole.FACULTY}
            userName={profile?.fullname || 'Faculty'}
            userAvatar={profile?.avatar}
            notifications={[]}
            currentPath="/dashboard/faculty/assignments"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <AdminPageHeader
                    icon={FileText}
                    title="Student"
                    titleAccent="Assignments"
                    subtitle="Create and manage student assignments"
                    eyebrow={{ icon: Home, label: "Faculty Portal" }}
                    actions={
                        <Link href="/dashboard/faculty/assignments/create">
                            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-[2px] text-sm font-semibold shadow-none shadow-blue-200 hover:bg-primary-hover hover:shadow-none transition-all">
                                <Plus className="h-5 w-5" />
                                Create Assignment
                            </button>
                        </Link>
                    }
                />

                {/* Filters */}
                <AdminFilterBar
                    searchValue={searchValue}
                    onSearchChange={setSearchValue}
                    searchPlaceholder="Search assignments..."
                    filters={[
                        {
                            id: 'course',
                            label: 'Course',
                            value: selectedCourseId,
                            onChange: setSelectedCourseId,
                            options: [
                                { value: 'all', label: 'All Courses' },
                                ...courses.map((c: any, idx: number) => ({
                                    value: c.id?.toString() || c.courseOfferingId?.toString() || c.courseofferingid?.toString() || c.courseid?.toString() || idx.toString(),
                                    label: c.name || c.course?.name || 'Unknown Course'
                                }))
                            ]
                        },
                        {
                            id: 'status',
                            label: 'Status',
                            value: 'Active Only',
                            onChange: () => setShowComingSoon(true),
                            options: [
                                { value: 'Active Only', label: 'Active Only' }
                            ]
                        }
                    ]}
                />

                {/* Assignments List */}
                <div className="space-y-4">
                    {assignments.map((assignment) => (
                        <div key={assignment.id} className="group p-6 bg-surface border border-border rounded-[2px] hover:border-border-hover transition-all flex flex-col gap-4 shadow-none">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                                    <div className="p-3 bg-primary-light text-primary rounded-[2px] group-hover:scale-105 transition-transform self-start shrink-0">
                                        <FileText className="h-6 w-6" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-lg text-text-primary group-hover:text-primary transition-colors truncate">
                                            {assignment.title}
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-1 text-sm text-text-secondary">
                                            <span className="font-medium text-text-primary bg-background px-2 py-0.5 rounded-[2px] whitespace-nowrap shrink-0">
                                                {assignment.code}
                                            </span>
                                            <span className="flex items-center gap-1 whitespace-nowrap shrink-0">
                                                <Calendar className="h-3.5 w-3.5 shrink-0" />
                                                Due: {assignment.dueDate}
                                            </span>
                                            <span className="flex items-center gap-1 whitespace-nowrap shrink-0">
                                                <Users className="h-3.5 w-3.5 shrink-0" />
                                                {assignment.submissions}/{assignment.totalStudents} Submitted
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 self-end lg:self-center">
                                    <div className={`px-3 py-1 rounded-[2px] text-xs font-semibold ${assignment.status === 'Active' ? 'bg-primary-light text-primary' : 'bg-surface-hover text-text-primary'
                                        }`}>
                                        {assignment.status}
                                    </div>
                                    <div className="flex items-center gap-1 border-l border-border pl-3">
                                        <Link href={`/dashboard/faculty/assignments/${assignment.id}`}>
                                            <button
                                                className="p-2 text-text-muted hover:text-primary hover:bg-primary-light rounded-[2px] transition-colors"
                                                title="View details"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </button>
                                        </Link>
                                        <Link href={`/dashboard/faculty/assignments/${assignment.id}/edit`}>
                                            <button className="p-2 text-text-muted hover:text-primary hover:bg-primary-light rounded-[2px] transition-colors" title="Edit">
                                                <Edit className="h-4 w-4" />
                                            </button>
                                        </Link>
                                        <button
                                            onClick={() => openDeleteModal(assignment.id)}
                                            className="p-2 text-text-muted hover:text-error-text hover:bg-error-bg rounded-[2px] transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="mt-2 pt-4 border-t border-border">
                                <div className="flex items-center justify-between text-xs text-text-secondary mb-1.5">
                                    <span>Submission Progress</span>
                                    <span className="font-medium text-text-primary">{Math.round((assignment.submissions / assignment.totalStudents) * 100)}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-background rounded-[2px] overflow-hidden">
                                    <div
                                        className="h-full bg-primary rounded-[2px]"
                                        style={{ width: `${(assignment.submissions / assignment.totalStudents) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {assignments.length === 0 && (
                        <div className="text-center py-12 bg-surface rounded-[2px] border border-border border-dashed">
                            <p className="text-text-secondary">No assignments found.</p>
                        </div>
                    )}
                </div>

                <Modal
                    isOpen={isDeleteModalOpen}
                    onClose={closeDeleteModal}
                    title="Delete Assignment"
                    type="danger"
                >
                    <div className="text-center sm:text-left">
                        <div className="flex flex-col items-center sm:items-start gap-4">
                            <div className="p-3 bg-error-bg rounded-[2px] text-error-text mb-2 sm:mb-0">
                                <AlertTriangle className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-text-secondary mb-4">
                                    Are you sure you want to delete this assignment? This action cannot be undone and all student submissions will be lost.
                                </p>
                                <div className="flex justify-end gap-3 w-full">
                                    <button
                                        onClick={closeDeleteModal}
                                        className="px-4 py-2 rounded-[2px] border border-border font-semibold text-text-primary hover:bg-background transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        className="px-4 py-2 rounded-[2px] bg-error-text text-white font-semibold hover:bg-red-700 shadow-none shadow-red-200 transition-colors"
                                    >
                                        Yes, Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </Modal>

                <Modal
                    isOpen={showComingSoon}
                    onClose={() => setShowComingSoon(false)}
                    title="Feature Coming Soon"
                    type="default"
                >
                    <div className="text-center py-4">
                        <div className="p-3 bg-primary-light rounded-[2px] text-primary w-16 h-16 flex items-center justify-center mx-auto mb-4">
                            <Clock className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-semibold text-text-primary mb-2">Assignment Management</h3>
                        <p className="text-text-secondary mb-6">
                            This feature is currently under development.
                        </p>
                        <button
                            onClick={() => setShowComingSoon(false)}
                            className="bg-gray-900 text-white px-6 py-2 rounded-[2px] text-sm font-medium hover:bg-gray-800 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </Modal>
            </div>
        </DashboardLayout>
    );
}

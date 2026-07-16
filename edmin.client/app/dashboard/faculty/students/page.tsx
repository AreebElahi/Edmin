'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { UserRole } from '@/types/types';
import { Users, Search, Filter, MoreVertical, Edit2, Mail, Save, X, Home, Download, AlertTriangle, UserCheck, UserMinus, FileText, CheckCircle2, BookOpen } from 'lucide-react';
import Link from 'next/link';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminFilterBar from '@/components/admin/AdminFilterBar';
import { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import { DashboardAPI } from '@/utils/api';
import { apiGet, apiPatch } from '@/api/apiContract';

export default function FacultyStudentsPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);

    const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [newGrade, setNewGrade] = useState('');
    const [updatingGrade, setUpdatingGrade] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [dash, studentsRes] = await Promise.all([
                DashboardAPI.getFacultyDashboard(),
                apiGet<any[]>('/faculty/students')
            ]);
            setProfile(dash.profile);
            setStudents(Array.isArray(studentsRes) ? studentsRes : ((studentsRes as any)?.data || []));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const openGradeModal = (student: any) => {
        setSelectedStudent(student);
        setNewGrade(student.grade === 'N/A' ? '' : student.grade);
        setIsGradeModalOpen(true);
    };

    const handleUpdateGrade = async () => {
        if (!selectedStudent || !newGrade) return;
        try {
            setUpdatingGrade(true);
            await apiPatch(`/faculty/students/${selectedStudent.id}/grade`, { grade: newGrade });
            setIsGradeModalOpen(false);
            fetchData(); // Refresh list
        } catch (err) {
            console.error('Failed to update grade', err);
        } finally {
            setUpdatingGrade(false);
        }
    };
    const filteredStudents = students.filter(student => {
        const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === 'All' || student.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    const groupedStudents = filteredStudents.reduce((acc, student: any) => {
        if (!acc[student.course]) {
            acc[student.course] = [];
        }
        acc[student.course].push(student);
        return acc;
    }, {} as Record<string, any[]>);

    if (loading) {
        return (
            <DashboardLayout userName="Loading..." userRole={UserRole.FACULTY} notifications={[]} currentPath="/dashboard/faculty/students">
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
            currentPath="/dashboard/faculty/students"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <AdminPageHeader
                    icon={Users}
                    title="Student"
                    titleAccent="Grading"
                    subtitle="View and manage student grades by course"
                    eyebrow={{ icon: Home, label: "Faculty Portal" }}
                    actions={
                        <button className="flex items-center gap-2 px-4 py-2 bg-surface border border-border text-text-primary font-medium rounded-[2px] hover:bg-surface-hover transition-colors">
                            <Download className="w-4 h-4" />
                            Export Grades
                        </button>
                    }
                />

                <AdminFilterBar
                    searchValue={searchTerm}
                    onSearchChange={setSearchTerm}
                    searchPlaceholder="Search by name, ID, or email..."
                    filters={[
                        {
                            id: 'status-filter',
                            label: 'Status',
                            value: filterStatus,
                            onChange: setFilterStatus,
                            options: [
                                { value: 'All', label: 'All Status' },
                                { value: 'Active', label: 'Active' },
                                { value: 'At Risk', label: 'At Risk' },
                                { value: 'Inactive', label: 'Inactive' }
                            ]
                        }
                    ]}
                />

                {/* Students List */}
                <div className="bg-surface rounded-[2px] shadow-none border border-border overflow-hidden">
                    <div className="space-y-8">
                        {Object.entries(groupedStudents as Record<string, any[]>).map(([courseName, courseStudents]) => (
                            <div key={courseName} className="mb-8 bg-surface rounded-[2px] shadow-none border border-border overflow-hidden">
                                <div className="bg-surface-hover px-6 py-4 border-b border-border flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-100 rounded-[2px] text-blue-600">
                                            <BookOpen className="w-5 h-5" />
                                        </div>
                                        <h2 className="text-xl font-bold text-text-primary">
                                            {courseName}
                                        </h2>
                                        <span className="text-sm text-text-secondary bg-surface px-3 py-1 rounded-[2px] border border-border shadow-none">
                                            {courseStudents.length} Students
                                        </span>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-background/50 border-b border-border">
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Student</th>
                                                <th className="px-6 py-4 text-center text-xs font-semibold text-text-secondary uppercase tracking-wider">Status</th>
                                                <th className="px-6 py-4 text-center text-xs font-semibold text-text-secondary uppercase tracking-wider">Attendance</th>
                                                <th className="px-6 py-4 text-center text-xs font-semibold text-text-secondary uppercase tracking-wider">Current Grade</th>
                                                <th className="px-6 py-4 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#EDEBE9]">
                                            {courseStudents.map((student: any) => (
                                                <tr key={student.id} className="hover:bg-background/50 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-[2px] bg-primary-light text-primary flex items-center justify-center font-bold text-sm">
                                                                {student.avatar ? (
                                                                    <img src={student.avatar} alt={student.name} className="w-full h-full rounded-[2px] object-cover" />
                                                                ) : (
                                                                    student.name.charAt(0)
                                                                )}
                                                            </div>
                                                            <div>
                                                                <div className="font-semibold text-text-primary">{student.name}</div>
                                                                <div className="text-xs text-text-secondary">{student.studentId}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-[2px] text-xs font-medium border ${student.status === 'Active' ? 'bg-primary-light text-primary border-border' :
                                                            student.status === 'At Risk' ? 'bg-error-bg text-error-text border-border' :
                                                                'bg-background text-text-primary border-border'
                                                            }`}>
                                                            {student.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="text-sm font-medium text-text-primary">{student.attendance}%</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`inline-block w-10 h-10 leading-10 text-center rounded-[2px] font-bold text-sm ${student.grade.startsWith('A') ? 'bg-green-100 text-green-700' :
                                                            student.grade.startsWith('B') ? 'bg-primary-light text-primary' :
                                                                student.grade.startsWith('C') ? 'bg-yellow-100 text-yellow-700' :
                                                                    'bg-red-100 text-red-700'
                                                            }`}>
                                                            {student.grade}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button 
                                                                onClick={() => openGradeModal(student)}
                                                                className="p-2 text-text-muted hover:text-primary hover:bg-primary-light rounded-[2px] transition-colors" title="Edit Grade"
                                                            >
                                                                <MoreVertical className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </div>
                    {filteredStudents.length === 0 && (
                        <div className="text-center py-12">
                            <div className="p-3 bg-background rounded-[2px] w-16 h-16 flex items-center justify-center mx-auto mb-4 text-text-muted">
                                <Search className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-medium text-text-primary">No students found</h3>
                            <p className="text-text-secondary mt-1">Try adjusting your search or filters</p>
                        </div>
                    )}
                </div>
            </div>

            <Modal
                isOpen={isGradeModalOpen}
                onClose={() => setIsGradeModalOpen(false)}
                title="Edit Student Grade"
            >
                {selectedStudent && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-text-primary mb-1">Student</label>
                            <div className="p-2 bg-background rounded-[2px] text-text-secondary text-sm">
                                {selectedStudent.name} ({selectedStudent.studentId})
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-primary mb-1">Grade</label>
                            <select
                                value={newGrade}
                                onChange={(e) => setNewGrade(e.target.value)}
                                className="w-full px-3 py-2 border border-border rounded-[2px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Select Grade</option>
                                <option value="A+">A+</option>
                                <option value="A">A</option>
                                <option value="A-">A-</option>
                                <option value="B+">B+</option>
                                <option value="B">B</option>
                                <option value="B-">B-</option>
                                <option value="C+">C+</option>
                                <option value="C">C</option>
                                <option value="C-">C-</option>
                                <option value="D">D</option>
                                <option value="F">F</option>
                            </select>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setIsGradeModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-text-primary bg-background hover:bg-border rounded-[2px] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdateGrade}
                                disabled={updatingGrade || !newGrade}
                                className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-hover rounded-[2px] transition-colors disabled:opacity-50"
                            >
                                {updatingGrade ? 'Saving...' : 'Save Grade'}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

        </DashboardLayout>
    );
}

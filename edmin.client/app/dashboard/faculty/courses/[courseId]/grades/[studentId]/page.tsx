'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { UserRole, Notification } from '@/types/types';
import { BookOpen, ChevronDown, ChevronRight, Save, ArrowLeft, User, UserCheck } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState, Fragment, useEffect } from 'react';
import { toast } from 'sonner';
import Modal from '@/components/Modal';
import { apiGet, apiPost } from '@/api/apiContract';

import { DashboardAPI, FacultyAPI } from '@/utils/api';

// Types
interface GradeItem {
    id: string;
    name: string;
    weight: number; // as percentage number (e.g. 10 for 10%)
    maxScore: number;
    score: string; // Changed to string for better input handling
    feedback: string;
}

interface GradeCategory {
    id: string;
    title: string;
    weight: number; // total weight
    items: GradeItem[];
}

// Initial Data
const initialGradeData: GradeCategory[] = [
    {
        id: 'assignments',
        title: 'Assignments',
        weight: 20,
        items: [
            { id: 'a1', name: 'Assignment 1', weight: 10, maxScore: 100, score: '85', feedback: 'Good job!' },
            { id: 'a2', name: 'Assignment 2', weight: 10, maxScore: 100, score: '', feedback: '' },
        ]
    },
    {
        id: 'quizzes',
        title: 'Quizzes',
        weight: 10,
        items: [
            { id: 'q1', name: 'Quiz 1', weight: 5, maxScore: 10, score: '9', feedback: '' },
            { id: 'q2', name: 'Quiz 2', weight: 5, maxScore: 10, score: '', feedback: '' },
        ]
    },
    {
        id: 'midterm',
        title: 'Midterm',
        weight: 30,
        items: [
            { id: 'mt', name: 'Midterm Exam', weight: 30, maxScore: 100, score: '', feedback: '' },
        ]
    },
    {
        id: 'final',
        title: 'Final Exam',
        weight: 40,
        items: [
            { id: 'fe', name: 'Final Exam', weight: 40, maxScore: 100, score: '', feedback: '' },
        ]
    }
];

export default function StudentGradingPage() {
    const params = useParams();
    const router = useRouter();
    const courseId = params.courseId as string;
    const studentId = params.studentId as string;

    const [isLoading, setIsLoading] = useState(true);
    const [gradeCategories, setGradeCategories] = useState<GradeCategory[]>([]);
    const [expandedCategories, setExpandedCategories] = useState<string[]>(['assignments', 'quizzes', 'midterm', 'final']);
    const [attendanceScore, setAttendanceScore] = useState<number>(46.15); // Percentage
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    const [user, setUser] = useState<{ name: string; avatar?: string }>({ name: 'Faculty' });
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [studentData, setStudentData] = useState<any>({
        name: 'Loading...',
        id: studentId,
        courseCode: courseId,
        courseName: 'Loading...'
    });

    useEffect(() => {
        const fetchAssessments = async () => {
            setIsLoading(true);
            try {
                const assessments = await apiGet<any[]>(`/faculty/courses/${courseId}/assessments?studentId=${studentId}`);
                
                // Group by type: ASSIGNMENT, QUIZ, MIDTERM, FINAL
                const newCategories: GradeCategory[] = [
                    { id: 'assignments', title: 'Assignments', weight: 20, items: [] },
                    { id: 'quizzes', title: 'Quizzes', weight: 10, items: [] },
                    { id: 'midterm', title: 'Midterm', weight: 30, items: [] },
                    { id: 'final', title: 'Final Exam', weight: 40, items: [] },
                ];

                if (Array.isArray(assessments)) {
                    assessments.forEach(ass => {
                        const result = ass.assessmentresult?.[0]; // Because we filtered by studentId, it should be an array of 0 or 1 item
                        
                        const item: GradeItem = {
                            id: ass.assessmentid.toString(),
                            name: ass.name,
                            weight: ass.weight || 10,
                            maxScore: ass.totalmarks || 100,
                            score: result ? result.obtainedmarks.toString() : '',
                            feedback: result ? (result.remarks || '') : ''
                        };

                        if (ass.type === 'ASSIGNMENT') newCategories[0].items.push(item);
                        else if (ass.type === 'QUIZ') newCategories[1].items.push(item);
                        else if (ass.type === 'MIDTERM') newCategories[2].items.push(item);
                        else if (ass.type === 'FINAL') newCategories[3].items.push(item);
                    });
                }
                
                // Load dashboard and student info
                const [dashboardData, studentsData] = await Promise.all([
                    DashboardAPI.getFacultyDashboard(),
                    FacultyAPI.getStudents()
                ]);
                
                if (dashboardData?.user) {
                    setUser({ name: dashboardData.user.name, avatar: dashboardData.user.avatar });
                    // setNotifications if available
                }
                
                const matchedStudent = studentsData.find((s: any) => s.studentId === studentId || s.id === studentId);
                if (matchedStudent) {
                    setStudentData({
                        name: matchedStudent.name,
                        id: matchedStudent.studentId,
                        courseCode: courseId, // or matchedStudent.course
                        courseName: matchedStudent.course
                    });
                }

                setGradeCategories(newCategories);
            } catch (err) {
                console.error(err);
                toast.error('Failed to load grades.');
                setGradeCategories(initialGradeData); // Fallback for UI if API fails
            } finally {
                setIsLoading(false);
            }
        };
        fetchAssessments();
    }, [courseId, studentId]);

    const toggleCategory = (categoryId: string) => {
        setExpandedCategories(prev =>
            prev.includes(categoryId)
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId]
        );
    };

    const handleScoreChange = (categoryId: string, itemId: string, value: string) => {
        setGradeCategories(prev => prev.map(cat => {
            if (cat.id !== categoryId) return cat;

            return {
                ...cat,
                items: cat.items.map(item => {
                    if (item.id !== itemId) return item;
                    return { ...item, score: value };
                })
            };
        }));
    };

    const handleFeedbackChange = (categoryId: string, itemId: string, value: string) => {
        setGradeCategories(prev => prev.map(cat => {
            if (cat.id !== categoryId) return cat;
            return {
                ...cat,
                items: cat.items.map(item => {
                    if (item.id !== itemId) return item;
                    return { ...item, feedback: value };
                })
            };
        }));
    };

    const calculateCategoryStats = (category: GradeCategory) => {
        let totalContribution = 0;

        // Sum of contributions
        totalContribution = category.items.reduce((sum, item) => {
            if (item.score === '') return sum;
            const scoreNum = parseFloat(item.score);
            if (isNaN(scoreNum)) return sum;
            return sum + (scoreNum / item.maxScore) * item.weight;
        }, 0);

        const percentage = (totalContribution / category.weight) * 100;

        return {
            grade: percentage.toFixed(2),
            percentage: percentage.toFixed(2) + ' %',
            contribution: totalContribution
        };
    };

    const calculateCourseTotal = () => {
        let totalContribution = 0;
        gradeCategories.forEach(cat => {
            totalContribution += calculateCategoryStats(cat).contribution;
        });

        return {
            grade: totalContribution.toFixed(2),
            percentage: totalContribution.toFixed(2) + ' %'
        };
    };

    const handleSave = () => {
        setIsConfirmModalOpen(true);
    };

    const confirmSave = async () => {
        setIsConfirmModalOpen(false);
        let errorCount = 0;

        for (const category of gradeCategories) {
            for (const item of category.items) {
                if (item.score !== '') {
                    try {
                        await apiPost(`/faculty/assessments/${item.id}/results`, {
                            studentId,
                            obtainedMarks: parseFloat(item.score),
                            remarks: item.feedback
                        });
                    } catch (err) {
                        console.error('Failed to save assessment', item.id, err);
                        errorCount++;
                    }
                }
            }
        }

        if (errorCount === 0) {
            toast.success('Grades saved successfully!');
            setTimeout(() => {
                router.push(`/dashboard/faculty/courses/${courseId}?tab=grades`);
            }, 1000);
        } else {
            toast.error(`Finished saving with ${errorCount} errors. Please check your inputs.`);
        }
    };

    return (
        <DashboardLayout
            userRole={UserRole.FACULTY}
            userName={user.name}
            userAvatar={user.avatar}
            notifications={notifications}
            currentPath={`/dashboard/faculty/courses/${courseId}/grades/${studentId}`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header with Back Navigation */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link
                            href={`/dashboard/faculty/courses/${courseId}?tab=grades`}
                            className="p-2 bg-surface border border-border rounded-[2px] hover:bg-background transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-text-secondary" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-text-primary">Grading: {studentData.name}</h1>
                            <p className="text-sm text-text-secondary">{studentData.id} • {studentData.courseName}</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => router.back()}
                            className="px-4 py-2 bg-surface border border-border text-text-primary font-medium rounded-[2px] hover:bg-background transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 bg-primary text-white font-medium rounded-[2px] hover:bg-primary-hover transition-colors flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            Save Grades
                        </button>
                    </div>
                </div>

                <div className="bg-surface rounded-[2px]  border border-border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px]">
                            <thead className="bg-background/50 border-b border-border">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-text-muted uppercase tracking-wider w-1/3">Grade Item</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Weight</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Grade</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Range</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Percentage</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Feedback</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#EDEBE9]">
                                {/* Course Header Row */}
                                <tr className="bg-surface">
                                    <td colSpan={6} className="px-6 py-4">
                                        <div className="flex items-center gap-2 font-bold text-text-primary">
                                            <BookOpen className="w-4 h-4 text-text-muted" />
                                            {studentData.courseName} ({studentData.courseCode})
                                        </div>
                                    </td>
                                </tr>

                                {gradeCategories.map((category) => {
                                    const stats = calculateCategoryStats(category);
                                    return (
                                        <Fragment key={category.id}>
                                            {/* Category Header */}
                                            <tr className="hover:bg-background transition-colors cursor-pointer" onClick={() => toggleCategory(category.id)}>
                                                <td colSpan={6} className="px-6 py-3">
                                                    <div className="flex items-center gap-2 font-semibold text-text-primary">
                                                        {expandedCategories.includes(category.id) ? (
                                                            <ChevronDown className="w-4 h-4 text-text-muted" />
                                                        ) : (
                                                            <ChevronRight className="w-4 h-4 text-text-muted" />
                                                        )}
                                                        {category.title}
                                                    </div>
                                                </td>
                                            </tr>

                                            {/* Category Items */}
                                            {expandedCategories.includes(category.id) && (
                                                <>
                                                    {category.items.map((item) => {
                                                        const scoreNum = parseFloat(item.score);
                                                        const percentage = !isNaN(scoreNum) && item.score !== ''
                                                            ? ((scoreNum / item.maxScore) * 100).toFixed(2) + ' %'
                                                            : '-';

                                                        return (
                                                            <tr key={item.id} className="hover:bg-primary-light/30 transition-colors">
                                                                <td className="px-6 py-4 pl-12">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-1.5 h-1.5 rounded-[2px] bg-gray-300"></div>
                                                                        <span className="text-sm text-text-primary">{item.name}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 text-sm text-text-secondary">{item.weight.toFixed(2)} %</td>
                                                                <td className="px-6 py-4">
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        max={item.maxScore}
                                                                        className="w-24 px-3 py-1.5 border border-border rounded-[2px] text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                                                        placeholder="-"
                                                                        value={item.score}
                                                                        onChange={(e) => handleScoreChange(category.id, item.id, e.target.value)}
                                                                    />
                                                                </td>
                                                                <td className="px-6 py-4 text-sm text-text-secondary">0-{item.maxScore}</td>
                                                                <td className="px-6 py-4 text-sm text-text-secondary">{percentage}</td>
                                                                <td className="px-6 py-4">
                                                                    <input
                                                                        type="text"
                                                                        className="w-full px-3 py-1.5 border border-border rounded-[2px] text-sm text-text-primary focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-border-hover"
                                                                        placeholder="Add feedback..."
                                                                        value={item.feedback}
                                                                        onChange={(e) => handleFeedbackChange(category.id, item.id, e.target.value)}
                                                                    />
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                    {/* Category Total Row */}
                                                    <tr className="bg-background/30 border-t border-border font-medium">
                                                        <td className="px-6 py-4 pl-12 text-sm text-text-primary">
                                                            ∑ {category.title} Total
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-text-primary">{category.weight.toFixed(2)} %</td>
                                                        <td className="px-6 py-4 text-sm text-text-primary">{stats.grade}</td>
                                                        <td className="px-6 py-4 text-sm text-text-secondary">0-100</td>
                                                        <td className="px-6 py-4 text-sm text-text-primary">{stats.percentage}</td>
                                                        <td className="px-6 py-4"></td>
                                                    </tr>
                                                </>
                                            )}
                                        </Fragment>
                                    );
                                })}

                                {/* Attendance Row */}
                                <tr className="hover:bg-background transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 font-semibold text-text-primary">
                                            <UserCheck className="w-4 h-4 text-rose-500" />
                                            Attendance
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-text-secondary">100.00 %</td>
                                    <td className="px-6 py-4 text-sm font-medium text-text-primary">{attendanceScore}</td>
                                    <td className="px-6 py-4 text-sm text-text-secondary">0-100</td>
                                    <td className="px-6 py-4 text-sm text-text-secondary">{attendanceScore} %</td>
                                    <td className="px-6 py-4"></td>
                                </tr>

                                {/* Course Total Row */}
                                <tr className="bg-background border-t-2 border-border font-bold">
                                    <td className="px-6 py-4 text-text-primary">
                                        <div className="flex items-center gap-2">
                                            <span>∑ Course Total</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">-</td>
                                    <td className="px-6 py-4 text-text-primary">{calculateCourseTotal().grade}</td>
                                    <td className="px-6 py-4 text-text-secondary">0-100</td>
                                    <td className="px-6 py-4 text-text-primary">{calculateCourseTotal().percentage}</td>
                                    <td className="px-6 py-4"></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <Modal
                    isOpen={isConfirmModalOpen}
                    onClose={() => setIsConfirmModalOpen(false)}
                    title="Confirm Save"
                    type="default"
                >
                    <div className="text-center">
                        <p className="text-text-primary mb-6">
                            Are you sure you want to save the grades for <strong>{studentData.name}</strong>?
                            This action will update the student's records.
                        </p>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => setIsConfirmModalOpen(false)}
                                className="px-5 py-2.5 rounded-[2px] border border-border font-semibold text-text-primary hover:bg-background transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmSave}
                                className="px-5 py-2.5 rounded-[2px] bg-primary text-white font-semibold hover:bg-primary-hover  shadow-blue-200 transition-colors flex items-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                Confirm Save
                            </button>
                        </div>
                    </div>
                </Modal>
            </div>
        </DashboardLayout>
    );
}

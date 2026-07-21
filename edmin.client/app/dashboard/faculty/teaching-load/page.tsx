'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { UserRole } from '@/types/types';
import { BookOpen, CheckCircle2, Clock, AlertCircle, ShieldAlert, Home } from 'lucide-react';
import { useState, useEffect } from 'react';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { apiGet, apiPost } from '@/api/apiContract';
import { DashboardAPI } from '@/utils/api';

export default function TeachingLoadPage() {
    const [status, setStatus] = useState<string>('pending');
    const [availableCourses, setAvailableCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [supervisorStatus, setSupervisorStatus] = useState<string>('pending');
    const [hodStatus, setHodStatus] = useState<string>('pending');

    const [selected, setSelected] = useState<string[]>([]);
    const [systemAssigned, setSystemAssigned] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [dash, coursesRes, loadsRes, assignedCoursesRes] = await Promise.all([
                    DashboardAPI.getFacultyDashboard(),
                    apiGet('/faculty/teaching-loads/available-courses').catch(() => []),
                    apiGet<any>('/faculty/approvals').then(res => res?.teachingLoads || res?.data?.teachingLoads || []).catch(() => []),
                    apiGet<any[]>('/faculty/courses').catch(() => [])
                ]);
                setProfile(dash.profile);
                const assignedCourses = assignedCoursesRes || [];
                
                // Map assigned courses to match availableCourses structure
                const mappedAssigned = assignedCourses.map((c: any) => ({
                    id: c.id?.toString() || c.courseofferingid?.toString(),
                    name: c.name || `Course ${c.id || c.courseofferingid}`,
                    credits: c.credits || 3
                }));

                const allCourses = [...((coursesRes as any[]) || [])];
                const existingIds = new Set(allCourses.map(c => c.id));
                for (const ac of mappedAssigned) {
                    if (!existingIds.has(ac.id)) {
                        allCourses.push(ac);
                    }
                }
                setAvailableCourses(allCourses);
                
                const loads = (loadsRes as any[]) || [];
                if (loads.length > 0) {
                    const currentLoad = loads[0];
                    setStatus(currentLoad.status.toLowerCase());
                    setSupervisorStatus(currentLoad.supervisorstatus?.toLowerCase() || 'pending');
                    setHodStatus(currentLoad.hodstatus?.toLowerCase() || 'pending');
                    if (currentLoad.teachingassignment) {
                        const assignedIds = currentLoad.teachingassignment
                            .map((ta: any) => (ta.courseofferingid ?? ta.courseoffering?.courseofferingid)?.toString())
                            .filter(Boolean);
                        setSelected(assignedIds);
                    }
                } else if (mappedAssigned.length > 0) {
                    setSelected(mappedAssigned.map((c: any) => c.id));
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const totalCredits = availableCourses
        .filter(c => selected.includes(String(c.id || c.courseofferingid || '')))
        .reduce((sum, c) => sum + c.credits, 0);

    const handleSubmit = async () => {
        let currentSelected = [...selected];
        let currentCredits = totalCredits;

        if (currentCredits < 9) {
            availableCourses.filter(c => !currentSelected.includes(String(c.id || c.courseofferingid || ''))).forEach(c => {
                if (currentCredits < 9) {
                    currentSelected.push(String(c.id || c.courseofferingid || ''));
                    currentCredits += c.credits;
                }
            });
            setSelected(currentSelected);
            setSystemAssigned(true);
        }
        
        try {
            const courseIds = currentSelected.map(id => parseInt(id)).filter(id => !isNaN(id));
            if (courseIds.length === 0) {
                console.error('No valid courses selected');
                return;
            }
            await apiPost('/faculty/teaching-loads', {
                semesterId: availableCourses[0]?.semesterId || undefined,
                courseOfferingIds: courseIds
            });
            setStatus('submitted');
        } catch (err) {
            console.error('Failed to submit teaching load', err);
        }
    };

    if (loading) {
        return (
            <DashboardLayout userName="Loading..." userRole={UserRole.FACULTY} notifications={[]} currentPath="/dashboard/faculty/teaching-load">
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
            currentPath="/dashboard/faculty/teaching-load"
        >
            <div className="max-w-4xl mx-auto px-4 py-8">
                <AdminPageHeader
                    icon={BookOpen}
                    title="Semester"
                    titleAccent="Teaching Load"
                    subtitle="Select your courses for the upcoming semester. Dual approval required."
                    eyebrow={{ icon: Home, label: "Faculty Portal" }}
                />

                <div className="bg-surface rounded-[2px] shadow-none border border-border p-6 mb-6">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6">
                        <h2 className="text-lg font-bold">Course Pool</h2>
                        <div className="text-sm font-semibold bg-primary-light text-primary px-3 py-1.5 rounded-[2px] self-start sm:self-auto shrink-0 whitespace-nowrap w-fit">
                            Total Credits: {totalCredits} / 9 min
                        </div>
                    </div>

                    <div className="space-y-3">
                        {availableCourses.map(course => {
                            const courseIdStr = String(course.id || course.courseofferingid || '');
                            const isSelected = selected.includes(courseIdStr);
                            const isDisabled = status !== 'pending';
                            return (
                                <label key={courseIdStr} className={`flex items-center p-3 sm:p-4 border rounded-[2px] transition-all ${isDisabled ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'} ${isSelected ? 'border-blue-500 bg-primary-light/50' : 'border-border hover:border-blue-300'}`}>
                                    <input
                                        type="checkbox"
                                        className={`w-5 h-5 shrink-0 text-primary rounded ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                        checked={isSelected}
                                        onChange={(e) => {
                                            if (isDisabled) return;
                                            if (e.target.checked) setSelected([...selected, courseIdStr]);
                                            else setSelected(selected.filter(id => id !== courseIdStr));
                                        }}
                                        disabled={isDisabled}
                                    />
                                    <div className="ml-3 sm:ml-4 flex-1 min-w-0 pr-2">
                                        <p className="font-semibold text-text-primary truncate">{course.code || courseIdStr}: {course.name}</p>
                                    </div>
                                    <div className="text-xs sm:text-sm font-medium text-text-secondary shrink-0 whitespace-nowrap">{course.credits} Credits</div>
                                </label>
                            );
                        })}
                    </div>

                    {status === 'pending' && (
                        <div className="mt-6">
                            {totalCredits < 9 && (
                                <div className="mb-4 bg-orange-50 border border-orange-200 text-orange-800 p-4 rounded-[2px] flex gap-3 text-sm font-medium">
                                    <AlertCircle className="w-5 h-5 shrink-0 text-orange-600" />
                                    <p>Warning: Your selected credits ({totalCredits}) are below the required minimum (9). Submitting now will trigger the System to Auto-Assign remaining courses and notify the Admin.</p>
                                </div>
                            )}
                            <button
                                onClick={handleSubmit}
                                className="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-3 rounded-[2px] transition-colors shadow-none shadow-blue-200"
                            >
                                Submit for Approval
                            </button>
                        </div>
                    )}

                    {status !== 'pending' && systemAssigned && (
                        <div className="mt-6 bg-error-bg border border-red-200 p-4 rounded-[2px] flex items-start gap-3 text-red-900 shadow-none">
                            <ShieldAlert className="w-6 h-6 shrink-0 text-error-text" />
                            <div>
                                <p className="font-bold text-sm uppercase tracking-wider mb-1">System Auto-Assignment Engaged</p>
                                <p className="text-sm">You submitted your load with insufficient credits. The system algorithmically force-assigned remaining courses to meet the 9-credit minimum. The Admin has been explicitly notified.</p>
                            </div>
                        </div>
                    )}
                </div>

                {status !== 'pending' && (
                    <div className="bg-surface rounded-[2px] shadow-none border border-border p-6">
                        <h2 className="text-lg font-bold mb-4 flex items-center justify-between">
                            Approval Status
                            <div className="flex gap-2">
                                <span className={`px-2.5 py-1 rounded-[2px] text-xs font-semibold uppercase ${supervisorStatus === 'approved' ? 'bg-green-100 text-green-800' : supervisorStatus === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'}`}>
                                    Supervisor: {supervisorStatus}
                                </span>
                                <span className={`px-2.5 py-1 rounded-[2px] text-xs font-semibold uppercase ${hodStatus === 'approved' ? 'bg-green-100 text-green-800' : hodStatus === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'}`}>
                                    HOD: {hodStatus}
                                </span>
                            </div>
                        </h2>
                        <div className="overflow-x-auto no-scrollbar pb-2 -mb-2">
                            <div className="flex items-center gap-4 text-sm font-medium min-w-max px-2">
                                <div className="flex flex-col items-center">
                                    <CheckCircle2 className="w-8 h-8 text-success-text mb-2" />
                                    <span>Submitted</span>
                                </div>
                                <div className="w-16 h-1 bg-border rounded">
                                    <div className="h-full bg-success-text rounded w-full"></div>
                                </div>
                                <div className={`flex flex-col items-center ${supervisorStatus === 'approved' ? 'text-success-text' : supervisorStatus === 'rejected' ? 'text-error-text' : 'text-orange-600'}`}>
                                    {supervisorStatus === 'approved' ? <CheckCircle2 className="w-8 h-8 mb-2" /> : <Clock className="w-8 h-8 mb-2" />}
                                    <span>Supervisor Review</span>
                                </div>
                                <div className="w-16 h-1 bg-border rounded">
                                    <div className={`h-full ${supervisorStatus === 'approved' ? 'bg-success-text w-full' : 'w-0'} rounded`}></div>
                                </div>
                                <div className={`flex flex-col items-center ${hodStatus === 'approved' ? 'text-success-text' : hodStatus === 'rejected' ? 'text-error-text' : hodStatus === 'pending' && supervisorStatus === 'approved' ? 'text-orange-600' : 'text-text-muted'}`}>
                                    {hodStatus === 'approved' ? <CheckCircle2 className="w-8 h-8 mb-2" /> : <Clock className="w-8 h-8 mb-2" />}
                                    <span>HOD Review</span>
                                </div>
                            </div>
                        </div>
                        <p className="text-sm text-text-secondary mt-6 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            If not approved within deadline, this request will be escalated to Admin.
                        </p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

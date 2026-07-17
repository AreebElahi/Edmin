'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { UserRole } from '@/types/types';
import { Building, PlusCircle, UserCheck, ChevronRight, BookOpen, Users, Loader2, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import Modal from '@/components/Modal';
import { useDepartments, useCreateDepartment, useMapCourseToDepartment, useUpdateDepartment, useDeleteDepartment, useCreateSection, useAssignDepartmentManagers } from '@/features/departments/hooks/useDepartments';
import { useUsers } from '@/features/users/hooks/useUsers';
import { useCourses } from '@/features/courses/hooks/useCourses';
import { toast } from 'react-hot-toast';

import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminStatusBadge from '@/components/admin/AdminStatusBadge';
import AdminActionIconButton from '@/components/admin/AdminActionIconButton';
import AdminPageWrapper from "@/components/admin/AdminPageWrapper";

export default function AdminDepartmentsPageContent() {
    const { data: currentUser } = useCurrentUser();
    // Data Fetching
    const { data: departments = [], isLoading: isLoadingDepts, isError: isErrorDepts, error: queryError } = useDepartments();

    if (isErrorDepts) {
        console.log("DEPARTMENTS QUERY ERROR:", JSON.stringify(queryError, Object.getOwnPropertyNames(queryError), 2));
    }
    const { data: faculty = [], isLoading: isLoadingFaculty } = useUsers({ role: 'FACULTY' });
    const { data: courses = [], isLoading: isLoadingCourses } = useCourses();
    
    // Mutations
    const createDeptMutation = useCreateDepartment();
    const mapCourseMutation = useMapCourseToDepartment();
    const updateDeptMutation = useUpdateDepartment();
    const deleteDeptMutation = useDeleteDepartment();
    const createSectionMutation = useCreateSection();
    const assignManagersMutation = useAssignDepartmentManagers();

    // Local State for Create
    const [newDeptName, setNewDeptName] = useState('');
    const [hod, setHod] = useState('');
    const [supervisor, setSupervisor] = useState('');
    const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null);

    // Local State for Mapping
    const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
    const [courseDeptId, setCourseDeptId] = useState<number | null>(null);
    const [courseCode, setCourseCode] = useState('');

    // Local State for Edit
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editDeptId, setEditDeptId] = useState<number | null>(null);
    const [editDeptName, setEditDeptName] = useState('');
    const [editDeptCode, setEditDeptCode] = useState('');
    const [editHod, setEditHod] = useState('');
    const [editSupervisor, setEditSupervisor] = useState('');
    const [editIsActive, setEditIsActive] = useState(true);

    // Local State for Delete
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteDeptId, setDeleteDeptId] = useState<number | null>(null);

    const handleCreateDepartment = (e: React.FormEvent) => {
        e.preventDefault();
        createDeptMutation.mutate({
            name: newDeptName,
            hodid: hod ? parseInt(hod, 10) : null,
            supervisorid: supervisor ? parseInt(supervisor, 10) : null
        }, {
            onSuccess: () => {
                toast.success('Department created successfully!');
                setNewDeptName('');
                setHod('');
                setSupervisor('');
            },
            onError: (err: any) => {
                toast.error(err.message || 'Failed to create department');
            }
        });
    };

    const openEditModal = (dept: any) => {
        setEditDeptId(dept.id);
        setEditDeptName(dept.name);
        setEditDeptCode(dept.code);
        
        // Find faculty id by matching name. In real app, the API should return hodid/supervisorid directly.
        const hodUser = faculty.find(f => f.name === dept.hod);
        const supUser = faculty.find(f => f.name === dept.supervisor);
        
        setEditHod(hodUser ? hodUser.id.toString() : '');
        setEditSupervisor(supUser ? supUser.id.toString() : '');
        setEditIsActive(dept.status === 'Active');
        setIsEditModalOpen(true);
    };

    const handleEditDepartment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editDeptId) return;

        updateDeptMutation.mutate({
            id: editDeptId,
            payload: {
                name: editDeptName,
                isactive: editIsActive
            }
        }, {
            onSuccess: () => {
                assignManagersMutation.mutate({
                    id: editDeptId,
                    hodId: editHod ? parseInt(editHod, 10) : null,
                    supervisorId: editSupervisor ? parseInt(editSupervisor, 10) : null
                }, {
                    onSuccess: () => {
                        toast.success('Department and managers updated successfully!');
                        setIsEditModalOpen(false);
                    },
                    onError: (err: any) => {
                        toast.error(err.message || 'Failed to update department managers');
                    }
                });
            },
            onError: (err: any) => {
                toast.error(err.message || 'Failed to update department');
            }
        });
    };

    const openDeleteModal = (id: number) => {
        setDeleteDeptId(id);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteDepartment = () => {
        if (!deleteDeptId) return;
        deleteDeptMutation.mutate(deleteDeptId, {
            onSuccess: () => {
                toast.success('Department deleted successfully!');
                setIsDeleteModalOpen(false);
                setDeleteDeptId(null);
            },
            onError: (err: any) => {
                toast.error(err.message || 'Failed to delete department');
                setIsDeleteModalOpen(false);
            }
        });
    };

    const handleCreateCourse = (e: React.FormEvent) => {
        e.preventDefault();
        if (courseDeptId === null) return;

        const parsedCourseId = parseInt(courseCode, 10);
        if (isNaN(parsedCourseId)) {
            toast.error('Please enter a valid numeric Course ID for mapping.');
            return;
        }

        mapCourseMutation.mutate({
            deptId: courseDeptId,
            courseId: parsedCourseId
        }, {
            onSuccess: () => {
                toast.success('Course mapped to department successfully!');
                setIsCourseModalOpen(false);
                setCourseCode('');
            },
            onError: (err: any) => {
                toast.error(err.message || 'Failed to map course');
            }
        });
    };

    const handleAddSection = (deptId: number) => {
        createSectionMutation.mutate(deptId, {
            onSuccess: (data: any) => {
                toast.success(data?.message || 'Section created successfully!');
            },
            onError: (err: any) => {
                toast.error(err.message || 'Failed to create section');
            }
        });
    };

    return (
        <DashboardLayout
            userRole={UserRole.ADMIN}
            userName={currentUser?.fullName || 'Admin'}
            notifications={[]}
            currentPath="/dashboard/admin/departments"
        >
            <AdminPageWrapper>
                <AdminPageHeader
                    icon={Building}
                    title="Department"
                    titleAccent="Management"
                    subtitle="Create departments and manage HODs and Supervisors."
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Create Department Form */}
                    <div className="lg:col-span-1 border border-border bg-surface rounded-[2px] shadow-none p-6 self-start">
                        <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                            <PlusCircle className="w-5 h-5 text-success-bg0" /> Create Department
                        </h2>
                        <form onSubmit={handleCreateDepartment} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-text-primary mb-1">Department Name</label>
                                <input type="text" required value={newDeptName} onChange={e => setNewDeptName(e.target.value)} className="w-full border border-gray-300 rounded-[2px] p-3 outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Physics" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-primary mb-1">Assign HOD</label>
                                <select value={hod} onChange={e => setHod(e.target.value)} className="w-full border border-gray-300 rounded-[2px] p-3 outline-none focus:ring-2 focus:ring-blue-500" disabled={isLoadingFaculty}>
                                    <option value="">{isLoadingFaculty ? 'Loading...' : 'None / Unassigned'}</option>
                                    {!isLoadingFaculty && faculty.map(t => (
                                        <option key={`hod-${t.id}`} value={t.id}>{t.name} ({t.dept})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-primary mb-1">Assign Supervisor</label>
                                <select value={supervisor} onChange={e => setSupervisor(e.target.value)} className="w-full border border-gray-300 rounded-[2px] p-3 outline-none focus:ring-2 focus:ring-blue-500" disabled={isLoadingFaculty}>
                                    <option value="">{isLoadingFaculty ? 'Loading...' : 'None / Unassigned'}</option>
                                    {!isLoadingFaculty && faculty.map(t => (
                                        <option key={`sup-${t.id}`} value={t.id}>{t.name} ({t.dept})</option>
                                    ))}
                                </select>
                            </div>
                            <button 
                                type="submit" 
                                disabled={createDeptMutation.isPending}
                                className="w-full bg-primary text-white font-semibold py-3 rounded-[2px] hover:bg-primary-hover transition-colors disabled:bg-blue-300 flex justify-center items-center gap-2"
                            >
                                {createDeptMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                                {createDeptMutation.isPending ? 'Creating...' : 'Activate Department'}
                            </button>
                        </form>
                    </div>

                    {/* Department List */}
                    <div className="lg:col-span-2 space-y-4">
                        <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                            <Building className="w-5 h-5 text-blue-500" /> Active Departments
                        </h2>
                        
                        {isLoadingDepts && (
                            <div className="flex justify-center items-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                            </div>
                        )}
                        
                        {isErrorDepts && (
                            <div className="bg-error-bg text-error-text p-4 rounded-[2px] text-sm border border-red-200">
                                Failed to load departments. Reason: {queryError?.message || 'Network Error'}. Please refresh the page.
                            </div>
                        )}

                        {!isLoadingDepts && !isErrorDepts && departments.length === 0 && (
                            <div className="text-center py-12 bg-surface rounded-[2px] border border-border shadow-none text-text-secondary">
                                No departments found. Create one to get started.
                            </div>
                        )}

                        {!isLoadingDepts && !isErrorDepts && departments.map(dept => (
                            <div key={dept.id} className="bg-surface border border-border hover:border-primary/30 transition-colors rounded-[2px] overflow-hidden">
                                <div
                                    className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer hover:bg-background/50"
                                    onClick={() => setSelectedDeptId(selectedDeptId === dept.id ? null : dept.id)}
                                >
                                    <div className="flex-1">
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-lg font-bold text-text-primary">{dept.name}</h3>
                                                <span className="bg-background text-text-primary text-xs px-2 py-0.5 rounded font-mono">{dept.code}</span>
                                                <AdminStatusBadge status={dept.status} variant={dept.status === 'Active' ? 'success' : 'error'} />
                                            </div>
                                            <div className="flex items-center gap-2 mt-2 sm:mt-0">
                                                <AdminActionIconButton
                                                    icon={Pencil}
                                                    onClick={(e: React.MouseEvent) => { e.stopPropagation(); openEditModal(dept); }}
                                                    variant="primary"
                                                    title="Edit Department"
                                                />
                                                <AdminActionIconButton
                                                    icon={Trash2}
                                                    onClick={(e: React.MouseEvent) => { e.stopPropagation(); openDeleteModal(dept.id); }}
                                                    variant="error"
                                                    title="Delete Department"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex flex-col sm:flex-row gap-4 text-sm text-text-primary mt-2">
                                            <div className="flex items-center gap-2">
                                                <UserCheck className="w-4 h-4 text-indigo-500" />
                                                <span><span className="font-semibold text-text-primary">HOD:</span> {dept.hod}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <UserCheck className="w-4 h-4 text-emerald-500" />
                                                <span><span className="font-semibold text-text-primary">Supervisor:</span> {dept.supervisor}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-background p-2 rounded-[2px] hidden sm:block ml-4">
                                        <ChevronRight className={`w-5 h-5 text-text-muted transition-transform ${selectedDeptId === dept.id ? 'rotate-90 text-blue-500' : ''}`} />
                                    </div>
                                </div>

                                {/* Expanded Sections Panel */}
                                {selectedDeptId === dept.id && (
                                    <div className="bg-surface-hover border-t border-border p-6 animate-in slide-in-from-top-2">
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="font-bold text-text-primary flex items-center gap-2">
                                                <Users className="w-4 h-4 text-blue-500" /> Department Sections & Cohorts
                                            </h4>
                                            <button 
                                                onClick={() => handleAddSection(dept.id)}
                                                disabled={createSectionMutation.isPending}
                                                className="text-xs bg-primary-light border border-blue-200 font-semibold px-3 py-1.5 rounded-[2px] text-primary hover:bg-primary-light transition-colors flex items-center gap-1  disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {createSectionMutation.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                                                + Add Section
                                            </button>
                                        </div>

                                        {dept.sections && dept.sections.length > 0 ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {dept.sections.map((sec, idx) => (
                                                    <div key={idx} className="bg-surface border border-border hover:border-primary/30 transition-colors relative overflow-hidden rounded-[2px] p-4">
                                                        <div className="absolute top-0 left-0 w-1 h-full bg-primary-light0"></div>
                                                        <div className="flex justify-between items-start mb-3">
                                                            <div className="font-bold text-text-primary text-lg">{sec.name}</div>
                                                            <div className="bg-background px-2 py-1 rounded text-xs font-bold text-text-primary">
                                                                {sec.students} Students
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-6 bg-surface border border-dashed border-gray-300 rounded-[2px] text-text-secondary text-sm">
                                                No sections assigned to this department yet.
                                            </div>
                                        )}
                                        
                                        {/* Courses Section */}
                                        <div className="mt-6 pt-6 border-t border-border">
                                            <div className="flex justify-between items-center mb-4">
                                                <h4 className="font-bold text-text-primary flex items-center gap-2">
                                                    <BookOpen className="w-4 h-4 text-indigo-500" /> Department Course Pool
                                                </h4>
                                                <button
                                                    onClick={() => { setCourseDeptId(dept.id); setIsCourseModalOpen(true); }}
                                                    className="text-xs bg-primary-light/50 border border-indigo-200 font-semibold px-3 py-1.5 rounded-[2px] text-primary hover:bg-indigo-100 transition-colors"
                                                >
                                                    + Map Course
                                                </button>
                                            </div>
 
                                            <div className="bg-surface border border-border rounded-[2px] overflow-hidden">
                                                <table className="w-full text-sm text-left">
                                                    <thead className="bg-background text-text-secondary font-bold uppercase text-[10px] tracking-wider">
                                                        <tr>
                                                            <th className="px-4 py-3">Code</th>
                                                            <th className="px-4 py-3">Course Name</th>
                                                            <th className="px-4 py-3 text-right">Credits</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-[#EDEBE9]">
                                                        {dept.courses && dept.courses.length > 0 ? (
                                                            dept.courses.map((c: any) => (
                                                                <tr key={c.id}>
                                                                    <td className="px-4 py-3 font-bold text-primary">{c.id}</td>
                                                                    <td className="px-4 py-3 text-text-primary">{c.name}</td>
                                                                    <td className="px-4 py-3 text-right font-semibold">{c.credits} Cr.</td>
                                                                </tr>
                                                            ))
                                                        ) : (
                                                            <tr>
                                                                <td colSpan={3} className="px-4 py-4 text-center text-text-muted italic">
                                                                    No courses mapped. Click <button type="button" onClick={() => { setCourseDeptId(dept.id); setIsCourseModalOpen(true); }} className="text-primary underline font-semibold hover:text-blue-800 focus:outline-none">map</button> to add.
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </AdminPageWrapper>

            {/* Map Course Modal */}
            <Modal isOpen={isCourseModalOpen} onClose={() => setIsCourseModalOpen(false)} title="Map Course to Department">
                <form onSubmit={handleCreateCourse} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-1">Select Course</label>
                        <select 
                            value={courseCode} 
                            onChange={e => setCourseCode(e.target.value)} 
                            className="w-full border border-gray-300 rounded-[2px] p-3 outline-none focus:ring-2 focus:ring-blue-500"
                            required
                            disabled={isLoadingCourses}
                        >
                            <option value="">{isLoadingCourses ? 'Loading courses...' : 'Select a course...'}</option>
                            {courses.map(c => (
                                <option key={c.courseid} value={c.courseid}>
                                    {c.code} — {c.name} ({c.credits} Cr)
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setIsCourseModalOpen(false)} className="px-5 py-2.5 text-text-primary font-medium hover:bg-background rounded-[2px] transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={mapCourseMutation.isPending} className="px-5 py-2.5 bg-primary text-white font-medium hover:bg-primary-hover rounded-[2px] transition-colors flex items-center gap-2">
                            {mapCourseMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                            Map Course
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Edit Department Modal */}
            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Department">
                <form onSubmit={handleEditDepartment} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-1">Department Name</label>
                        <input type="text" required value={editDeptName} onChange={e => setEditDeptName(e.target.value)} className="w-full border border-gray-300 rounded-[2px] p-3 outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-1">Department Code</label>
                        <input type="text" required value={editDeptCode} onChange={e => setEditDeptCode(e.target.value)} className="w-full border border-gray-300 rounded-[2px] p-3 outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-1">Assign HOD</label>
                        <select value={editHod} onChange={e => setEditHod(e.target.value)} className="w-full border border-gray-300 rounded-[2px] p-3 outline-none focus:ring-2 focus:ring-blue-500" disabled={isLoadingFaculty}>
                            <option value="">None / Unassigned</option>
                            {!isLoadingFaculty && faculty.map(t => (
                                <option key={`edit-hod-${t.id}`} value={t.id}>{t.name} ({t.dept})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-1">Assign Supervisor</label>
                        <select value={editSupervisor} onChange={e => setEditSupervisor(e.target.value)} className="w-full border border-gray-300 rounded-[2px] p-3 outline-none focus:ring-2 focus:ring-blue-500" disabled={isLoadingFaculty}>
                            <option value="">None / Unassigned</option>
                            {!isLoadingFaculty && faculty.map(t => (
                                <option key={`edit-sup-${t.id}`} value={t.id}>{t.name} ({t.dept})</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2 mt-4 bg-background p-3 rounded-[2px] border border-border">
                        <input type="checkbox" id="editIsActive" checked={editIsActive} onChange={e => setEditIsActive(e.target.checked)} className="w-4 h-4 text-primary rounded focus:ring-blue-500" />
                        <label htmlFor="editIsActive" className="text-sm font-medium text-text-primary cursor-pointer">Department is Active</label>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-5 py-2.5 text-text-primary font-medium hover:bg-background rounded-[2px] transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={updateDeptMutation.isPending} className="px-5 py-2.5 bg-primary text-white font-medium hover:bg-primary-hover rounded-[2px] transition-colors flex items-center gap-2">
                            {updateDeptMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                            Save Changes
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Delete Department">
                <div className="space-y-4">
                    <p className="text-text-primary">Are you sure you want to delete this department? This action will hide the department from the active list.</p>
                    <p className="text-sm font-semibold text-error-text bg-error-bg p-3 rounded-[2px] border border-red-100">
                        Warning: Deletion will fail if there are active students or courses mapped to this department.
                    </p>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setIsDeleteModalOpen(false)} className="px-5 py-2.5 text-text-primary font-medium hover:bg-background rounded-[2px] transition-colors">
                            Cancel
                        </button>
                        <button type="button" onClick={handleDeleteDepartment} disabled={deleteDeptMutation.isPending} className="px-5 py-2.5 bg-error-text text-white font-medium hover:bg-red-700 rounded-[2px] transition-colors flex items-center gap-2">
                            {deleteDeptMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                            Yes, Delete
                        </button>
                    </div>
                </div>
            </Modal>
        </DashboardLayout>
    );
}

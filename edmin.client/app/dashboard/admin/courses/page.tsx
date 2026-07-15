'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { UserRole } from '@/types/types';
import { BookOpen, PlusCircle, CheckCircle, Search, Edit3, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useCourses, useCreateCourse, useUpdateCourse, useToggleCourseStatus } from '@/features/courses/hooks/useCourses';
import { useDepartments } from '@/features/departments/hooks/useDepartments';
import Modal from '@/components/Modal';

import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
export default function AdminCoursesPage() {
    const { data: currentUser } = useCurrentUser();
    // Data Fetching
    const { data: courses, isLoading: isLoadingCourses } = useCourses();
    const { data: departments, isLoading: isLoadingDepts } = useDepartments();

    // Mutations
    const createCourseMutation = useCreateCourse();
    const updateCourseMutation = useUpdateCourse();
    const toggleStatusMutation = useToggleCourseStatus();

    // Search & Filter
    const [searchQuery, setSearchQuery] = useState('');

    // Modals
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Form State (Create/Edit)
    const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        credits: 3,
        basecapacity: 50,
        description: '',
        departmentIds: [] as number[]
    });

    const [courseToDelete, setCourseToDelete] = useState<number | null>(null);

    // Handlers
    const handleOpenCreate = () => {
        setFormData({ code: '', name: '', credits: 3, basecapacity: 50, description: '', departmentIds: [] });
        setIsAddModalOpen(true);
    };

    const handleOpenEdit = (course: any) => {
        setSelectedCourseId(course.courseid);
        setFormData({
            code: course.code,
            name: course.name,
            credits: course.credits,
            basecapacity: course.basecapacity || 50,
            description: course.description || '',
            departmentIds: course.departmentcourse.map((dc: any) => dc.departmentid)
        });
        setIsEditModalOpen(true);
    };

    const handleSubmitCreate = (e: React.FormEvent) => {
        e.preventDefault();
        createCourseMutation.mutate(formData, {
            onSuccess: () => setIsAddModalOpen(false)
        });
    };

    const handleSubmitEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedCourseId) {
            updateCourseMutation.mutate({ id: selectedCourseId, data: formData }, {
                onSuccess: () => setIsEditModalOpen(false)
            });
        }
    };

    const handleArchive = (id: number) => {
        setCourseToDelete(id);
    };

    const confirmArchive = () => {
        if (courseToDelete) {
            toggleStatusMutation.mutate({ id: courseToDelete, isactive: false }, {
                onSuccess: () => setCourseToDelete(null)
            });
        }
    };

    // Filter courses safely handling null/undefined
    const filteredCourses = courses?.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.code.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    return (
        <DashboardLayout userRole={UserRole.ADMIN} userName={currentUser?.fullName || 'Admin'} notifications={[]} currentPath="/dashboard/admin/courses">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="bg-surface rounded-[2px] p-8 shadow-none border border-border mb-8 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
                    <div className="flex items-center gap-4 z-10">
                        <div className="p-4 bg-background text-success-text rounded-[2px]">
                            <BookOpen className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-semibold text-text-primary ">Master Course Catalog</h1>
                            <p className="text-text-secondary font-medium mt-1">Manage global curriculum, credits, and department mapping.</p>
                        </div>
                    </div>
                    <button 
                        onClick={handleOpenCreate} 
                        className="bg-emerald-600 text-white font-bold py-3 px-6 rounded-[2px] hover:bg-emerald-700 transition-colors shadow-none shadow-emerald-200 flex items-center gap-2 shrink-0 z-10"
                    >
                        <PlusCircle className="w-5 h-5" /> Add New Course
                    </button>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted w-5 h-5" />
                        <input 
                            type="text" 
                            placeholder="Search by course name or code..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-surface border border-border rounded-[2px] outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all font-medium"
                        />
                    </div>
                </div>

                {/* Course List */}
                {isLoadingCourses ? (
                    <div className="space-y-4 ">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-24 bg-background rounded-[2px] w-full"></div>
                        ))}
                    </div>
                ) : filteredCourses.length === 0 ? (
                    <div className="text-center py-16 bg-surface border border-border rounded-[2px] shadow-none">
                        <BookOpen className="w-12 h-12 text-border-hover mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-text-primary mb-1">No courses found</h3>
                        <p className="text-text-secondary">Try adjusting your search query or add a new course.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCourses.map(course => (
                            <div key={course.courseid} className="bg-surface border border-warning-text text-warning-text hover:bg-warning-bg hover:text-warning-text transition-colors">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="bg-background text-success-text font-semibold px-3 py-1 rounded-[2px] text-sm border border-border">
                                        {course.code}
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleOpenEdit(course)} className="p-2 bg-primary-light text-primary hover:bg-blue-600 hover:text-white rounded-[2px] transition-colors">
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleArchive(course.courseid)} className="p-2 bg-error-bg text-error-text hover:bg-rose-600 hover:text-white rounded-[2px] transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                
                                <h3 className="text-xl font-bold text-text-primary mb-2 leading-tight min-h-[56px]">{course.name}</h3>
                                
                                <div className="flex flex-wrap gap-2 mb-6">
                                    {course.departmentcourse.length > 0 ? (
                                        course.departmentcourse.map(dc => (
                                            <span key={dc.departmentid} className="bg-background border border-border text-text-primary font-bold px-2.5 py-1 rounded-[2px] text-[10px] uppercase tracking-wider">
                                                {dc.department.code}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-xs text-rose-500 font-medium italic">No Dept Assigned</span>
                                    )}
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-border">
                                    <div className="text-center">
                                        <p className="text-[10px] font-semibold uppercase text-text-muted tracking-widest mb-1">Credits</p>
                                        <p className="font-bold text-text-primary">{course.credits} CH</p>
                                    </div>
                                    <div className="w-px h-8 bg-background"></div>
                                    <div className="text-center">
                                        <p className="text-[10px] font-semibold uppercase text-text-muted tracking-widest mb-1">Capacity</p>
                                        <p className="font-bold text-text-primary">{course.basecapacity || 50}</p>
                                    </div>
                                    <div className="w-px h-8 bg-background"></div>
                                    <div className="text-center">
                                        <p className="text-[10px] font-semibold uppercase text-text-muted tracking-widest mb-1">Status</p>
                                        <p className="font-bold text-emerald-500 flex items-center justify-center gap-1">
                                            <CheckCircle className="w-3 h-3" /> Active
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* CREATE / EDIT MODAL */}
            <Modal 
                isOpen={isAddModalOpen || isEditModalOpen} 
                onClose={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} 
                title={isAddModalOpen ? 'Add New Course' : 'Edit Course Information'}
            >
                <form className="space-y-4" onSubmit={isAddModalOpen ? handleSubmitCreate : handleSubmitEdit}>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-1 ml-1">Course Code</label>
                            <input 
                                type="text" 
                                required
                                value={formData.code}
                                onChange={e => setFormData({...formData, code: e.target.value})}
                                placeholder="e.g. CS-101" 
                                className="w-full bg-background border border-border rounded-[2px] px-4 py-3 outline-none focus:border-emerald-500 focus:bg-surface transition-all font-bold" 
                            />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-1 ml-1">Credit Hours</label>
                            <select 
                                required
                                value={formData.credits}
                                onChange={e => setFormData({...formData, credits: Number(e.target.value)})}
                                className="w-full bg-background border border-border rounded-[2px] px-4 py-3 outline-none focus:border-emerald-500 focus:bg-surface transition-all font-bold"
                            >
                                <option value={1}>1 Credit</option>
                                <option value={2}>2 Credits</option>
                                <option value={3}>3 Credits</option>
                                <option value={4}>4 Credits</option>
                            </select>
                        </div>
                        <div className="col-span-2">
                            <label className="block text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-1 ml-1">Course Title</label>
                            <input 
                                type="text" 
                                required
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                placeholder="e.g. Introduction to Computer Science" 
                                className="w-full bg-background border border-border rounded-[2px] px-4 py-3 outline-none focus:border-emerald-500 focus:bg-surface transition-all font-bold" 
                            />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-1 ml-1">Base Capacity</label>
                            <input 
                                type="number" 
                                required
                                min={20}
                                value={formData.basecapacity}
                                onChange={e => setFormData({...formData, basecapacity: Number(e.target.value)})}
                                className={`w-full bg-background border rounded-[2px] px-4 py-3 outline-none transition-all font-bold ${formData.basecapacity < 20 ? 'border-rose-500 focus:border-rose-500' : 'border-border focus:border-emerald-500 focus:bg-surface'}`} 
                            />
                            {formData.basecapacity < 20 && (
                                <p className="text-xs text-rose-500 mt-1 font-medium">At least 20 students are required for this course.</p>
                            )}
                        </div>
                        <div className="col-span-2">
                            <label className="block text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-1 ml-1">Course Description</label>
                            <textarea 
                                value={formData.description}
                                onChange={e => setFormData({...formData, description: e.target.value})}
                                placeholder="Write a brief description of the course..." 
                                rows={3}
                                className="w-full bg-background border border-border rounded-[2px] px-4 py-3 outline-none focus:border-emerald-500 focus:bg-surface transition-all font-bold resize-none" 
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-1 ml-1">Map to Department(s) (Hold Ctrl/Cmd to select multiple)</label>
                            {isLoadingDepts ? (
                                <div className="text-sm text-text-secondary">Loading departments...</div>
                            ) : departments?.length === 0 ? (
                                <div className="p-4 bg-error-bg border border-rose-200 rounded-[2px] text-error-text text-sm font-bold flex flex-col items-center justify-center text-center">
                                    <p>No departments exist in the database!</p>
                                    <p className="text-xs font-medium mt-1">Please create a Department first before mapping a Master Course.</p>
                                </div>
                            ) : (
                                <select 
                                    multiple 
                                    value={formData.departmentIds.map(String)}
                                    onChange={e => {
                                        const selected = Array.from(e.target.selectedOptions, option => Number(option.value));
                                        setFormData({...formData, departmentIds: selected});
                                    }}
                                    className="w-full bg-background border border-border rounded-[2px] px-4 py-3 outline-none focus:border-emerald-500 focus:bg-surface transition-all font-bold min-h-[120px]"
                                >
                                    {departments?.map(dept => (
                                        <option key={dept.departmentid} value={dept.departmentid}>
                                            {dept.name} ({dept.code})
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </div>
                    <button 
                        type="submit" 
                        disabled={createCourseMutation.isPending || updateCourseMutation.isPending}
                        className="w-full mt-6 bg-emerald-600 disabled:bg-gray-400 text-white font-semibold py-4 rounded-[2px] hover:bg-emerald-700 transition-colors shadow-none shadow-emerald-200"
                    >
                        {isAddModalOpen ? 'Create Master Course' : 'Save Changes'}
                    </button>
                </form>
            </Modal>

            {/* DELETE CONFIRMATION MODAL */}
            <Modal
                isOpen={courseToDelete !== null}
                onClose={() => setCourseToDelete(null)}
                title="Archive Course"
            >
                <div className="space-y-6">
                    <p className="text-text-primary font-medium">Are you sure you want to archive this course? This action will hide the course from the active catalog.</p>
                    <div className="flex gap-4">
                        <button 
                            onClick={() => setCourseToDelete(null)}
                            className="flex-1 bg-background text-text-primary font-bold py-3 rounded-[2px] hover:bg-border transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={confirmArchive}
                            disabled={toggleStatusMutation.isPending}
                            className="flex-1 bg-rose-600 text-white font-bold py-3 rounded-[2px] hover:bg-rose-700 transition-colors shadow-none shadow-rose-200"
                        >
                            {toggleStatusMutation.isPending ? 'Archiving...' : 'Yes, Archive'}
                        </button>
                    </div>
                </div>
            </Modal>
        </DashboardLayout>
    );
}

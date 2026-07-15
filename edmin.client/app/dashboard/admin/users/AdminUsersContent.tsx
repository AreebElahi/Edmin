'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { UserRole } from '@/types/types';
import { 
    Users, PlusCircle, Check, GraduationCap, Briefcase, ChevronRight, 
    FileText, Download, BookOpen, TrendingUp, Upload, Filter, Search, 
    MoreVertical, Shield, UserX, UserCheck, KeyRound, Clock, Settings, Loader2
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Modal from '@/components/Modal';
import { toast } from 'sonner';
import { useUsers, useDepartments, useRegisterUser, useToggleUserStatus, useResetUserPassword, useUserAuditLogs, useBulkImportUsers, useAssignUserRole } from '@/features/users/hooks/useUsers';
import { User } from '@/features/users/api/userApi';

import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
export default function AdminUsersContent() {
    const { data: currentUser } = useCurrentUser();
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState<'directory' | 'students' | 'teachers' | 'roles'>('directory');

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab === 'students' || tab === 'teachers' || tab === 'directory' || tab === 'roles') {
            setActiveTab(tab as any);
        }
    }, [searchParams]);

    // Filters & Search
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterDept, setFilterDept] = useState('All');

    // Fetch real data from backend
    const { data: users = [], isLoading: isLoadingUsers } = useUsers({
        search: searchTerm,
        role: filterRole !== 'All' ? filterRole : undefined,
        status: filterStatus !== 'All' ? filterStatus : undefined,
        departmentId: filterDept !== 'All' ? filterDept : undefined,
    });

    const { data: departments = [] } = useDepartments();
    const { mutateAsync: registerUser, isPending: isRegistering } = useRegisterUser();
    const { mutate: toggleUserStatus } = useToggleUserStatus();
    const { mutateAsync: resetUserPassword } = useResetUserPassword();
    const { mutateAsync: bulkImportUsers, isPending: isImporting } = useBulkImportUsers();
    const { mutateAsync: assignUserRole } = useAssignUserRole();

    // Modals & States
    const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
    const [isBulkImportModalOpen, setIsBulkImportModalOpen] = useState(false);
    const [generatedCredentials, setGeneratedCredentials] = useState<{ email: string, pass: string } | null>(null);
    
    const [selectedAuditUser, setSelectedAuditUser] = useState<{ id: string, name: string } | null>(null);
    const [selectedRoleUser, setSelectedRoleUser] = useState<{ id: string, name: string, role: string } | null>(null);
    const [isAssigningRole, setIsAssigningRole] = useState(false);
    const { data: auditLogs = [], isLoading: isLoadingAudit } = useUserAuditLogs(selectedAuditUser?.id || '');

    const [importFile, setImportFile] = useState<File | null>(null);
    const [importSummary, setImportSummary] = useState<{ created: number, failed: number, errors: string[] } | null>(null);

    // Form States
    const [name, setName] = useState('');
    const [role, setRole] = useState('STUDENT');
    const [department, setDepartment] = useState('');
    const [previewEmail, setPreviewEmail] = useState('');
    const [previewIdentifier, setPreviewIdentifier] = useState('');
    const [emailOverride, setEmailOverride] = useState('');
    const [userHasEditedEmail, setUserHasEditedEmail] = useState(false);
    const [isPreviewing, setIsPreviewing] = useState(false);
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Debounced unified identity preview whenever name, role, or department changes
    useEffect(() => {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        if (name.trim().length < 2) {
            setPreviewEmail('');
            setPreviewIdentifier('');
            if (!userHasEditedEmail) {
                setEmailOverride('');
            }
            return;
        }

        setIsPreviewing(true);
        debounceTimer.current = setTimeout(async () => {
            try {
                const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
                const deptQuery = department ? `&departmentId=${department}` : '';
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/admin/users/preview-identity?name=${encodeURIComponent(name)}&role=${role}${deptQuery}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                const json = await res.json();
                if (json.success) {
                    setPreviewEmail(json.data.institutionalEmail);
                    setPreviewIdentifier(json.data.identifier);
                    if (!userHasEditedEmail) {
                        setEmailOverride(json.data.username || '');
                    }
                } else {
                    setPreviewEmail('');
                    setPreviewIdentifier('');
                }
            } catch {
                setPreviewEmail('');
                setPreviewIdentifier('');
            } finally {
                setIsPreviewing(false);
            }
        }, 400);

        return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
    }, [name, role, department, userHasEditedEmail]);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const finalEmail = emailOverride.includes('@') ? emailOverride : `${emailOverride}@edmin.edu.pk`;
            const result = await registerUser({
                name,
                email: finalEmail,
                role,
                departmentId: department ? parseInt(department, 10) : undefined
            });
            
            setGeneratedCredentials({ email: result.user.email, pass: result.tempPassword });
            setName('');
            setPreviewEmail('');
            setPreviewIdentifier('');
            setEmailOverride('');
            setUserHasEditedEmail(false);
            setDepartment('');
            setIsAddUserModalOpen(false);
        } catch (err: any) {
            toast.error(err.message || 'Failed to register user');
        }
    };

    const handleToggleStatus = (id: string, currentStatus: string) => {
        toggleUserStatus({ userId: id, isActive: currentStatus !== 'Active' });
    };

    const handlePasswordReset = async (user: User) => {
        try {
            const result = await resetUserPassword(user.id);
            setGeneratedCredentials({ email: user.email, pass: result.temporaryPassword });
        } catch (err: any) {
            alert(err.message || 'Failed to reset password');
        }
    };

    const handleBulkImport = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!importFile) return;
        try {
            const result = await bulkImportUsers(importFile);
            setImportSummary(result);
            if (result.failed === 0) {
                toast.success(`Import complete — ${result.created} users created.`);
            } else {
                toast.warning(`Import done with ${result.failed} failures. See summary for details.`);
            }
        } catch (err: any) {
            toast.error(err.message || 'Bulk import failed. Please check your CSV format.');
        }
    };

    const handleDownloadTemplate = () => {
        const headers = 'fullName,email,role,departmentCode,temporaryPassword';
        const example = 'John Doe,john.doe@university.edu,STUDENT,CS,Welcome@123';
        const example2 = 'Jane Smith,jane.smith@university.edu,FACULTY,EE,';
        const example3 = 'Alice Admin,alice@university.edu,ADMIN,CS,';
        const csv = [headers, example, example2, example3].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'import_template_v2.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    // Filter users based on active tab
    let filteredUsers = users;
    if (activeTab === 'students') {
        filteredUsers = users.filter(u => u.role === 'STUDENT' && u.status === 'Inactive');
    } else if (activeTab === 'teachers') {
        filteredUsers = users.filter(u => u.role === 'FACULTY' && u.status === 'Inactive');
    }

    return (
        <DashboardLayout
            userRole={UserRole.ADMIN}
            userName={currentUser?.fullName || 'Admin'}
            notifications={[]}
            currentPath="/dashboard/admin/users"
        >
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Modern Header Panel */}
                <div className="relative overflow-hidden rounded-[2px] bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-900 p-6 sm:p-8 text-white shadow-none mb-8">
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 h-48 w-48 sm:h-64 sm:w-64 rounded-[2px] bg-primary-light0 opacity-20 blur-3xl"></div>
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="hidden sm:block p-2 bg-surface/10 rounded-[2px]  shrink-0">
                                    <Users className="w-5 h-5 sm:w-8 sm:h-8 text-blue-300" />
                                </div>
                                <h1 className="text-2xl sm:text-3xl font-semibold  leading-tight">Identity & Access <span className="text-blue-300">Management</span></h1>
                            </div>
                            <p className="text-xs sm:text-base text-slate-300/80 max-w-xl">Centralized control for user lifecycles, roles, and profiles.</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                            <button onClick={() => setIsBulkImportModalOpen(true)} className="w-full sm:w-auto px-5 py-3 sm:py-2.5 bg-surface/10 hover:bg-surface/20  rounded-[1.2rem] text-sm font-bold transition-all border border-white/20 flex items-center justify-center gap-2 ">
                                <Upload className="w-4 h-4" /> Bulk CSV Import
                            </button>
                            <button onClick={() => setIsAddUserModalOpen(true)} className="w-full sm:w-auto px-5 py-3 sm:py-2.5 bg-primary hover:bg-primary-hover text-white rounded-[1.2rem] text-sm font-bold shadow-none shadow-blue-900/50 transition-all flex items-center justify-center gap-2 ">
                                <PlusCircle className="w-4 h-4" /> Add Individual
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sub-navigation Tabs - Scrollable on Mobile */}
                <div className="flex overflow-x-auto scrollbar-hide md:flex-wrap gap-2 mb-8 bg-surface p-2 rounded-[2px] shadow-none border border-border w-full md:w-fit">
                    <button onClick={() => setActiveTab('directory')} className={`whitespace-nowrap px-5 py-3 font-bold text-sm rounded-[2px] transition-all shrink-0 ${activeTab === 'directory' ? 'bg-primary text-white shadow-none shadow-indigo-100' : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'}`}>All Users</button>
                    <button onClick={() => setActiveTab('students')} className={`whitespace-nowrap px-5 py-3 font-bold text-sm rounded-[2px] transition-all shrink-0 ${activeTab === 'students' ? 'bg-primary text-white shadow-none shadow-blue-100' : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'}`}>Student Archives</button>
                    <button onClick={() => setActiveTab('teachers')} className={`whitespace-nowrap px-5 py-3 font-bold text-sm rounded-[2px] transition-all shrink-0 ${activeTab === 'teachers' ? 'bg-emerald-600 text-white shadow-none shadow-emerald-100' : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'}`}>Faculty Archives</button>
                    <button onClick={() => setActiveTab('roles')} className={`whitespace-nowrap px-5 py-3 font-bold text-sm rounded-[2px] transition-all shrink-0 ${activeTab === 'roles' ? 'bg-rose-600 text-white shadow-none shadow-rose-100' : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'}`}>Role Matrix</button>
                </div>

                {/* Tab: Directory & Archives */}
                {(activeTab === 'directory' || activeTab === 'students' || activeTab === 'teachers') && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                        {generatedCredentials && (
                            <div className="bg-background border border-border rounded-[2px] p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                                <div>
                                    <h3 className="text-lg font-bold text-emerald-900 flex items-center gap-2"><Check className="w-5 h-5" /> Credentials Generated</h3>
                                    <p className="text-sm text-success-text">Please provide these details securely to the user.</p>
                                </div>
                                <div className="bg-surface p-4 rounded-[2px] shadow-none border border-border font-mono text-sm">
                                    Email: <b>{generatedCredentials.email}</b> | Pass: <b>{generatedCredentials.pass}</b>
                                </div>
                                <button onClick={() => setGeneratedCredentials(null)} className="text-success-text bg-background p-2 rounded-[2px] hover:bg-emerald-200">
                                    <UserX className="w-5 h-5" />
                                </button>
                            </div>
                        )}

                        <div className="bg-surface rounded-[2.5rem] shadow-none border border-border overflow-hidden">
                            {/* Toolbar */}
                            <div className="p-4 sm:p-6 border-b border-border bg-surface-hover/50 flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
                                <div className="relative w-full lg:w-96">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                                    <input 
                                        type="text" 
                                        placeholder="Search by name, ID, or email..." 
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full bg-surface border border-border pl-11 pr-4 py-3 rounded-[2px] outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all font-medium text-sm sm:text-base"
                                    />
                                </div>
                                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full lg:w-auto">
                                    <div className="flex flex-1 sm:flex-none items-center justify-between sm:justify-start gap-2 bg-surface px-4 py-3 rounded-[2px] border border-border shadow-none text-xs sm:text-sm font-semibold">
                                        <div className="flex items-center gap-2"><Filter className="w-4 h-4 text-text-muted" /> Role</div>
                                        <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="bg-transparent outline-none ml-2 text-primary font-bold">
                                            <option value="All">All</option>
                                            <option value="STUDENT">Student</option>
                                            <option value="FACULTY">Faculty</option>
                                            <option value="STAFF">Staff</option>
                                            <option value="HR">HR</option>
                                            <option value="ADMIN">Admin</option>
                                        </select>
                                    </div>
                                    <div className="flex flex-1 sm:flex-none items-center justify-between sm:justify-start gap-2 bg-surface px-4 py-3 rounded-[2px] border border-border shadow-none text-xs sm:text-sm font-semibold">
                                        <span>Status</span>
                                        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-transparent outline-none ml-2 text-primary font-bold">
                                            <option value="All">All</option>
                                            <option value="Active">Active</option>
                                            <option value="Inactive">Inactive</option>
                                        </select>
                                    </div>
                                    <div className="flex flex-1 sm:flex-none items-center justify-between sm:justify-start gap-2 bg-surface px-4 py-3 rounded-[2px] border border-border shadow-none text-xs sm:text-sm font-semibold">
                                        <span>Dept</span>
                                        <select value={filterDept} onChange={e => setFilterDept(e.target.value)} className="bg-transparent outline-none ml-2 text-primary font-bold max-w-24 truncate">
                                            <option value="All">All</option>
                                            {departments.map(d => (
                                                <option key={d.departmentid} value={d.departmentid.toString()}>{d.code}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Data Table */}
                            <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                                <table className="w-full text-left text-sm text-text-secondary whitespace-nowrap sm:whitespace-normal">
                                    <thead className="bg-surface-hover text-text-secondary text-xs uppercase tracking-widest font-semibold">
                                        <tr>
                                            <th className="px-6 py-4">User</th>
                                            <th className="px-6 py-4">Role & Dept</th>
                                            <th className="px-6 py-4">Security Status</th>
                                            <th className="px-6 py-4 text-right">Admin Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-surface">
                                        {filteredUsers.length === 0 ? (
                                            <tr><td colSpan={4} className="text-center py-10 text-text-secondary font-bold">No users match your criteria.</td></tr>
                                        ) : filteredUsers.map(user => (
                                            <tr key={user.id} className="hover:bg-surface-hover transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-10 h-10 rounded-[2px] flex items-center justify-center font-semibold shadow-none shrink-0 ${user.role === 'Student' ? 'bg-primary-light text-primary' : user.role === 'Faculty' ? 'bg-background text-success-text' : 'bg-indigo-100 text-primary'}`}>
                                                            {user.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-text-primary group-hover:text-primary transition-colors">{user.name} <span className="text-text-muted text-xs font-normal">#{user.id}</span></div>
                                                            <div className="text-sm font-medium text-text-secondary">{user.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-text-primary">{user.role}</div>
                                                    <div className="text-xs text-text-secondary uppercase font-semibold">{user.dept}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 rounded-[2px] text-[10px] font-semibold uppercase tracking-widest ${user.status === 'Active' ? 'bg-background text-success-text' : 'bg-error-bg text-error-text'}`}>
                                                        {user.status}
                                                    </span>
                                                    <div className="text-[10px] text-text-muted mt-1 flex items-center gap-1 font-semibold"><Clock className="w-3 h-3"/>
                                                        {(() => {
                                                            const ts = (user as any).lastActive;
                                                            if (!ts) return 'Never active';
                                                            const diff = Date.now() - new Date(ts).getTime();
                                                            const mins = Math.floor(diff / 60000);
                                                            if (mins < 1) return 'Active just now';
                                                            if (mins < 60) return `Active ${mins}m ago`;
                                                            const hrs = Math.floor(mins / 60);
                                                            if (hrs < 24) return `Active ${hrs}h ago`;
                                                            const days = Math.floor(hrs / 24);
                                                            return `Active ${days}d ago`;
                                                        })()}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-end gap-2 transition-opacity">
                                                        <button 
                                                            onClick={() => handleToggleStatus(user.id, user.status)}
                                                            className={`p-2 rounded-[2px] border ${user.status === 'Active' ? 'text-error-text border-rose-200 hover:bg-error-bg' : 'text-success-text border-emerald-200 hover:bg-background'} transition-colors`}
                                                            title={user.status === 'Active' ? 'Deactivate Account' : 'Activate Account'}
                                                        >
                                                            {user.status === 'Active' ? <UserX className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
                                                        </button>
                                                        <button onClick={() => handlePasswordReset(user)} className="p-2 rounded-[2px] border border-indigo-200 text-primary hover:bg-primary-light transition-colors" title="Force Password Reset">
                                                            <KeyRound className="w-5 h-5" />
                                                        </button>
                                                        <button onClick={() => setSelectedRoleUser({ id: user.id, name: user.name, role: user.role })} className="p-2 rounded-[2px] border border-border text-text-secondary hover:bg-indigo-50 hover:text-indigo-600 transition-colors" title="Manage Additional Roles">
                                                            <Shield className="w-5 h-5" />
                                                        </button>
                                                        <button onClick={() => setSelectedAuditUser({ id: user.id, name: user.name })} className="p-2 rounded-[2px] border border-border text-text-secondary hover:bg-surface-hover transition-colors" title="View Audit Trail">
                                                            <MoreVertical className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab: Role Matrix */}
                {activeTab === 'roles' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-surface rounded-[2px] p-8 border border-border shadow-none">
                            <h2 className="text-2xl font-semibold text-text-primary mb-6 flex items-center gap-3"><Shield className="w-8 h-8 text-indigo-500" /> Permitted Actions</h2>
                            <div className="space-y-6">
                                <div className="border border-border bg-primary-light/50 p-6 rounded-[2px]">
                                    <h3 className="font-bold text-indigo-900 flex items-between mb-4">Super Admin (You)</h3>
                                    <ul className="space-y-3 font-semibold text-sm text-indigo-800">
                                        <li className="flex gap-2"><Check className="w-4 h-4 text-indigo-500"/> Bypass System Escalations</li>
                                        <li className="flex gap-2"><Check className="w-4 h-4 text-indigo-500"/> Complete User Lifecycle Mgt</li>
                                        <li className="flex gap-2"><Check className="w-4 h-4 text-indigo-500"/> Infrastructure Settings Edit</li>
                                    </ul>
                                </div>
                                <div className="border border-border bg-background/50 p-6 rounded-[2px]">
                                    <h3 className="font-bold text-emerald-900 flex items-between mb-4">HR Managers</h3>
                                    <ul className="space-y-3 font-semibold text-sm text-emerald-800">
                                        <li className="flex gap-2"><Check className="w-4 h-4 text-emerald-500"/> Process Leave Requests</li>
                                        <li className="flex gap-2"><Check className="w-4 h-4 text-emerald-500"/> Manage Faculty Payroll</li>
                                        <li className="flex gap-2 flex-wrap opacity-50"><UserX className="w-4 h-4 text-rose-500"/> Cannot bypass escalation timers</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <div className="bg-surface rounded-[2px] p-8 border border-border shadow-none">
                            <h2 className="text-2xl font-semibold text-text-primary mb-6 flex items-center gap-3"><Settings className="w-8 h-8 text-text-muted" /> Security Settings</h2>
                            <p className="text-text-secondary mb-6">Configure global parameters enforced by the system for all user roles.</p>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 border border-border rounded-[2px]">
                                    <div><p className="font-bold text-text-primary">Force 2FA Everywhere</p><p className="text-xs text-text-secondary">Require app authenticator</p></div>
                                    <div className="w-12 h-6 bg-indigo-600 rounded-[2px] flex items-center p-1"><div className="w-4 h-4 bg-surface rounded-[2px] translate-x-6"></div></div>
                                </div>
                                <div className="flex items-center justify-between p-4 border border-border rounded-[2px]">
                                    <div><p className="font-bold text-text-primary">Session Timeout</p><p className="text-xs text-text-secondary">Auto logout after inactivity</p></div>
                                    <select className="border border-border rounded-[2px] p-1 text-sm font-bold bg-surface-hover outline-none"><option>30 mins</option><option>1 Hour</option></select>
                                </div>
                                <div className="flex items-center justify-between p-4 border border-border rounded-[2px]">
                                    <div><p className="font-bold text-text-primary">Audit Log Retention</p><p className="text-xs text-text-secondary">How long to keep activity data</p></div>
                                    <select className="border border-border rounded-[2px] p-1 text-sm font-bold bg-surface-hover outline-none"><option>1 Year</option><option>Indefinite</option></select>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modals for Add/Import */}
                <Modal isOpen={isAddUserModalOpen} onClose={() => setIsAddUserModalOpen(false)} title="Register Individual Account" type="default">
                    <form onSubmit={handleRegister} className="space-y-4 p-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-widest mb-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="e.g. John Doe"
                                    className="w-full border-2 border-border rounded-[2px] p-4 font-bold outline-none focus:border-indigo-500 transition-colors"
                                />
                            </div>
                        </div>

                        {/* Editable Email Override */}
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-widest">Email Address / Username Override</label>
                                {userHasEditedEmail && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setUserHasEditedEmail(false);
                                        }}
                                        className="text-[10px] text-primary font-bold hover:underline"
                                    >
                                        Reset to Auto
                                    </button>
                                )}
                            </div>
                            <div className="relative group flex items-center bg-surface border-2 border-border rounded-[2px] overflow-hidden focus-within:border-indigo-500 transition-colors">
                                <div className="pl-4 flex items-center pointer-events-none">
                                    <span className="text-lg">✉️</span>
                                </div>
                                <input
                                    type="text"
                                    value={emailOverride}
                                    onChange={(e) => {
                                        setUserHasEditedEmail(true);
                                        setEmailOverride(e.target.value);
                                    }}
                                    className="w-full pl-3 pr-2 py-3.5 bg-transparent border-0 text-text-primary font-bold text-sm outline-none transition-all placeholder:text-text-muted"
                                    placeholder={isPreviewing ? "Calculating..." : "john.doe"}
                                />
                                {!emailOverride.includes('@') && emailOverride.length > 0 && (
                                    <div className="pr-4 py-3.5 text-sm text-text-muted font-bold select-none whitespace-nowrap bg-transparent">
                                        @edmin.edu.pk
                                    </div>
                                )}
                            </div>
                            <p className="text-[10px] text-text-muted mt-1.5 font-medium">
                                {userHasEditedEmail ? "Custom email override active." : "Prefilled with generated email. Edit to customize."}
                            </p>
                        </div>
                        
                        {/* Auto-generated Identifier preview */}
                        <div>
                            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-widest mb-1">Institutional ID (Auto-generated)</label>
                            <div className="w-full border-2 rounded-[2px] px-4 py-3.5 flex items-center gap-3 bg-surface-hover border-border">
                                <span className="text-lg">🏷️</span>
                                {isPreviewing ? (
                                    <span className="text-text-muted font-medium text-sm ">Calculating...</span>
                                ) : previewIdentifier ? (
                                    <>
                                        <span className="font-bold text-text-primary text-sm truncate">{previewIdentifier}</span>
                                        <span className="ml-auto shrink-0 bg-indigo-100 text-primary text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-[2px]">Next ID</span>
                                    </>
                                ) : (
                                    <span className="text-text-muted font-medium text-sm">Enter a name above to preview...</span>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-widest mb-1">System Role</label>
                            <select required value={role} onChange={e => setRole(e.target.value)} className="w-full border-2 border-border rounded-[2px] p-4 font-bold outline-none focus:border-indigo-500 transition-colors bg-surface">
                                <option value="STUDENT">Student</option>
                                <option value="FACULTY">Faculty</option>
                                <option value="STAFF">Staff</option>
                                <option value="HR">HR</option>
                                <option value="ADMIN">Admin</option>
                            </select>
                        </div>
                        {role === 'FACULTY' || role === 'STUDENT' || role === 'STAFF' ? (
                            <div>
                                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-widest mb-1">Department</label>
                                <select required value={department} onChange={e => setDepartment(e.target.value)} className="w-full border-2 border-border rounded-[2px] p-4 font-bold outline-none focus:border-indigo-500 transition-colors bg-surface">
                                    <option value="" disabled>Select Department...</option>
                                    {departments.map(dept => (
                                        <option key={dept.departmentid} value={dept.departmentid}>{dept.name}</option>
                                    ))}
                                </select>
                            </div>
                        ) : null}
                        <button type="submit" disabled={isRegistering} className="w-full mt-4 bg-primary text-white font-semibold py-4 rounded-[2px] hover:bg-primary-hover transition-colors shadow-none shadow-indigo-200 disabled:opacity-50">
                            {isRegistering ? 'Creating...' : 'Create Account'}
                        </button>
                    </form>
                </Modal>

                <Modal isOpen={isBulkImportModalOpen} onClose={() => { setIsBulkImportModalOpen(false); setImportSummary(null); setImportFile(null); }} title="Bulk User Import" type="default">
                    <div className="space-y-4 p-2">
                        {!importSummary ? (
                            <form onSubmit={handleBulkImport} className="space-y-4">
                                {/* Drop zone */}
                                <label className="block border-2 border-dashed border-border rounded-[2px] p-8 bg-surface-hover hover:bg-background hover:border-indigo-300 transition-all cursor-pointer group text-center">
                                    <input
                                        type="file"
                                        accept=".csv"
                                        className="hidden"
                                        onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                                    />
                                    <div className="w-14 h-14 bg-surface rounded-[2px] flex items-center justify-center mx-auto mb-3 shadow-none group-hover:scale-105 transition-transform">
                                        <Upload className="w-7 h-7 text-indigo-500" />
                                    </div>
                                    {importFile ? (
                                        <>
                                            <h3 className="font-bold text-text-primary">{importFile.name}</h3>
                                            <p className="text-xs text-text-muted mt-1">{(importFile.size / 1024).toFixed(1)} KB · Click to change</p>
                                        </>
                                    ) : (
                                        <>
                                            <h3 className="font-bold text-text-primary">Click to upload or drag CSV here</h3>
                                            <p className="text-xs text-text-muted mt-1">Max 10 MB · CSV format only</p>
                                        </>
                                    )}
                                </label>

                                {/* Column reference */}
                                <div className="bg-slate-900 rounded-[2px] p-4 text-xs font-mono text-slate-300 space-y-1">
                                    <p className="text-text-secondary text-[10px] uppercase font-bold tracking-widest mb-2">Required CSV columns</p>
                                    <p><span className="text-amber-400">fullName</span> — Full display name</p>
                                    <p><span className="text-amber-400">email</span> — Unique institutional email</p>
                                    <p><span className="text-amber-400">role</span> — <span className="text-emerald-400">STUDENT</span> | <span className="text-emerald-400">FACULTY</span> | <span className="text-emerald-400">ADMIN</span> | <span className="text-emerald-400">HR</span></p>
                                    <p><span className="text-amber-400">departmentCode</span> — Dept code (e.g. CS, EE)</p>
                                    <p><span className="text-text-secondary">temporaryPassword</span> — Optional, auto-generated if blank</p>
                                </div>

                                {/* Template download */}
                                <div className="flex justify-between items-center bg-primary-light px-4 py-3 rounded-[2px] text-blue-900">
                                    <span className="flex items-center gap-2 text-sm font-medium">
                                        <FileText className="w-4 h-4"/>
                                        import_template_v2.csv
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleDownloadTemplate}
                                        className="text-xs font-bold bg-surface text-primary px-3 py-1.5 rounded-[2px] shadow-none border border-border hover:bg-blue-600 hover:text-white transition-colors"
                                    >
                                        <Download className="w-3 h-3 inline mr-1" />Download
                                    </button>
                                </div>

                                <button
                                    type="submit"
                                    disabled={!importFile || isImporting}
                                    className="w-full bg-slate-900 text-white font-semibold py-3.5 rounded-[2px] hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    <Upload className="w-4 h-4" />
                                    {isImporting ? 'Processing rows...' : 'Upload & Process'}
                                </button>
                            </form>
                        ) : (
                            <div className="space-y-4">
                                <div className={`rounded-[2px] p-4 border ${
                                    importSummary.failed === 0
                                        ? 'bg-background border-border text-emerald-800'
                                        : 'bg-warning-bg border-border text-amber-800'
                                }`}>
                                    <h3 className="font-bold text-base mb-2">Import Summary</h3>
                                    <div className="flex gap-6 text-sm">
                                        <span className="flex items-center gap-1.5">
                                            <Check className="w-4 h-4 text-success-text" />
                                            <b>{importSummary.created}</b> created
                                        </span>
                                        {importSummary.failed > 0 && (
                                            <span className="flex items-center gap-1.5 text-error-text">
                                                <span className="w-4 h-4 inline-flex items-center justify-center font-semibold">✕</span>
                                                <b>{importSummary.failed}</b> failed
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {importSummary.errors.length > 0 && (
                                    <div className="bg-error-bg border border-border rounded-[2px] p-4 text-rose-800 max-h-44 overflow-y-auto text-sm">
                                        <h4 className="font-bold mb-2 text-xs uppercase tracking-widest">Row Errors</h4>
                                        <ul className="space-y-1">
                                            {importSummary.errors.map((err, i) => (
                                                <li key={i} className="flex gap-2">
                                                    <span className="text-rose-400 shrink-0">✕</span>
                                                    <span>{err}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => { setImportSummary(null); setImportFile(null); }}
                                        className="flex-1 bg-background text-text-primary font-bold py-3 rounded-[2px] hover:bg-slate-200 transition-colors"
                                    >
                                        Import Another
                                    </button>
                                    <button
                                        onClick={() => { setIsBulkImportModalOpen(false); setImportSummary(null); setImportFile(null); }}
                                        className="flex-1 bg-slate-900 text-white font-bold py-3 rounded-[2px] hover:bg-slate-800 transition-colors"
                                    >
                                        Done
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </Modal>

                <Modal isOpen={!!selectedAuditUser} onClose={() => setSelectedAuditUser(null)} title={`Audit Trail: ${selectedAuditUser?.name}`} type="default">
                    <div className="p-2">
                        {isLoadingAudit ? (
                            <div className="text-center py-8 text-text-secondary font-medium ">Loading audit logs...</div>
                        ) : auditLogs.length === 0 ? (
                            <div className="text-center py-8 text-text-secondary font-medium">No audit logs found for this user.</div>
                        ) : (
                            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                                {auditLogs.map((log: any, idx: number) => (
                                    <div key={idx} className="bg-surface border border-border rounded-[2px] p-4 shadow-none flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-[2px] bg-primary-light flex items-center justify-center shrink-0">
                                            <Shield className="w-5 h-5 text-indigo-500" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-text-primary">{log.action.replace(/_/g, ' ')}</h4>
                                            <div className="text-sm text-text-secondary mt-1">
                                                Performed by <b>{log.performedBy}</b> on {new Date(log.timestamp).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </Modal>

                <Modal isOpen={!!selectedRoleUser} onClose={() => setSelectedRoleUser(null)} title={`Manage Roles: ${selectedRoleUser?.name}`} type="default">
                    <div className="p-2 space-y-4">
                        <div className="bg-indigo-50 border border-indigo-100 rounded-[2px] p-4 text-sm text-indigo-800">
                            <strong>Base Role:</strong> {selectedRoleUser?.role}<br/>
                            <span className="text-xs text-indigo-600 mt-1 block">Base roles define primary workflows. Additional roles can be assigned below to grant auxiliary dashboard access.</span>
                        </div>
                        
                        <div className="space-y-3">
                            <h4 className="font-bold text-sm text-text-primary uppercase tracking-widest">Assign Additional Role</h4>
                            <div className="flex gap-2">
                                <button 
                                    onClick={async () => {
                                        if (!selectedRoleUser) return;
                                        setIsAssigningRole(true);
                                        try {
                                            await assignUserRole({ userId: selectedRoleUser.id, roleName: 'HR', action: 'assign' });
                                            toast.success("HR Role assigned successfully. User must re-login to see changes.");
                                        } catch(e: any) {
                                            toast.error(e.message || "Failed to assign role");
                                        } finally {
                                            setIsAssigningRole(false);
                                        }
                                    }}
                                    disabled={isAssigningRole}
                                    className="px-4 py-2 bg-emerald-100 text-emerald-800 font-bold rounded-[2px] hover:bg-emerald-200 transition-colors text-sm flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isAssigningRole ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                    + Assign HR Role
                                </button>
                                <button 
                                    onClick={async () => {
                                        if (!selectedRoleUser) return;
                                        setIsAssigningRole(true);
                                        try {
                                            await assignUserRole({ userId: selectedRoleUser.id, roleName: 'HR', action: 'revoke' });
                                            toast.success("HR Role revoked successfully. User must re-login to see changes.");
                                        } catch(e: any) {
                                            toast.error(e.message || "Failed to revoke role");
                                        } finally {
                                            setIsAssigningRole(false);
                                        }
                                    }}
                                    disabled={isAssigningRole}
                                    className="px-4 py-2 bg-rose-100 text-rose-800 font-bold rounded-[2px] hover:bg-rose-200 transition-colors text-sm flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isAssigningRole ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                    - Revoke HR Role
                                </button>
                            </div>
                        </div>
                    </div>
                </Modal>

            </div>
        </DashboardLayout>
    );
}

'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { UserRole } from '@/types/types';
import { User, Mail, Phone, Calendar, Tag, Camera, Loader2, CheckCircle, Award, BookOpen, Users, Briefcase } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCurrentProfile, useUpdateProfile, useAvatar } from '@/features/profile/hooks/useProfile';
import AvatarUpload from '@/components/AvatarUpload';

export default function UnifiedProfilePage() {
    const [isEditing, setIsEditing] = useState(false);
    const [phone, setPhone] = useState('');
    const [expertiseInput, setExpertiseInput] = useState('');
    const [expertiseTags, setExpertiseTags] = useState<string[]>([]);

    const { data: profile, isLoading } = useCurrentProfile();
    const updateProfile = useUpdateProfile();
    const { data: avatar } = useAvatar(profile?.userId, profile?.role);

    useEffect(() => {
        if (profile) {
            setPhone(profile.phone || '');
            const filteredTags = (profile.tags || []).filter((t: string) => !profile.stats?.activeCourses || !profile.stats?.teachingLoad || t);
            setExpertiseTags(filteredTags);
        }
    }, [profile]);

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-[2px] animate-spin"></div>
            </div>
        );
    }

    const userRole = (profile?.role?.toLowerCase() as UserRole) || UserRole.STUDENT;
    const displayName = profile?.fullName || profile?.username || 'User';

    const handleSave = async () => {
        if (isEditing) {
            const payload: any = { phone };
            if (userRole === UserRole.FACULTY) {
                payload.expertise = expertiseTags;
            }
            await updateProfile.mutateAsync(payload);
            setIsEditing(false);
        } else {
            setIsEditing(true);
        }
    };

    const handleAddExpertise = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && expertiseInput.trim()) {
            e.preventDefault();
            const newTag = expertiseInput.trim().toUpperCase();
            if (!expertiseTags.includes(newTag)) {
                setExpertiseTags([...expertiseTags, newTag]);
            }
            setExpertiseInput('');
        }
    };

    const handleRemoveExpertise = (tagToRemove: string) => {
        setExpertiseTags(expertiseTags.filter(tag => tag !== tagToRemove));
    };

    // Color theme configuration based on role
    const themeConfig: Record<string, { gradient: string; text: string; bgLight: string; iconBg: string; label: string }> = {
        [UserRole.ADMIN]: {
            gradient: 'bg-primary',
            text: 'text-primary',
            bgLight: 'bg-surface/10',
            iconBg: 'bg-primary/10 text-primary',
            label: 'System Administrator'
        },
        [UserRole.FACULTY]: {
            gradient: 'bg-primary',
            text: 'text-primary',
            bgLight: 'bg-primary-light',
            iconBg: 'bg-primary-light text-primary',
            label: 'Faculty Professor'
        },
        [UserRole.HR]: {
            gradient: 'from-emerald-600 to-teal-700',
            text: 'text-success-text',
            bgLight: 'bg-background',
            iconBg: 'bg-background text-success-text',
            label: 'HR Administrator'
        },
        [UserRole.STUDENT]: {
            gradient: 'from-violet-600 to-purple-700',
            text: 'text-primary',
            bgLight: 'bg-background',
            iconBg: 'bg-background text-primary',
            label: 'Active Student'
        }
    };

    const theme = themeConfig[userRole] || themeConfig[UserRole.STUDENT];

    return (
        <DashboardLayout
            userRole={userRole}
            userName={displayName}
            userAvatar={avatar || undefined}
            notifications={[]}
            currentPath="/dashboard/profile"
        >
            <div className="max-w-5xl mx-auto px-4 py-8">
                {/* Header Profile Card */}
                <div className="bg-surface rounded-[2px] shadow-none border border-border overflow-hidden mb-8">
                    <div className={`h-40 bg-gradient-to-r ${theme.gradient} relative`}>
                        <button className="absolute bottom-4 right-4 p-2 bg-surface/20 hover:bg-surface/30  rounded-[2px] text-white transition-colors">
                            <Camera className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="px-8 pb-8 flex flex-col md:flex-row items-end -mt-16 gap-6">
                        <AvatarUpload
                            userId={profile?.userId}
                            role={profile?.role}
                            displayName={displayName}
                            size="md"
                            accentColor={theme.bgLight}
                            accentTextColor={theme.text}
                        />
                        <div className="flex-1 pb-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h1 className="text-3xl font-bold text-text-primary">{displayName}</h1>
                                    <p className={`${theme.text} font-semibold`}>
                                        {profile?.designation ? profile.designation : theme.label}
                                        {profile?.department && ` • ${profile.department}`}
                                    </p>
                                </div>
                                <button
                                    onClick={handleSave}
                                    disabled={updateProfile.isPending}
                                    className="px-6 py-2.5 bg-gray-900 text-white font-semibold rounded-[2px] hover:bg-gray-800 transition-all shadow-none  disabled:opacity-60 flex items-center gap-2"
                                >
                                    {updateProfile.isPending ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                                    ) : isEditing ? (
                                        <><CheckCircle className="w-4 h-4" /> Save Changes</>
                                    ) : (
                                        'Edit Profile'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Sidebar Contact Details */}
                    <div className="md:col-span-1 space-y-6">
                        <div className="bg-surface rounded-[2px] p-6 shadow-none border border-border">
                            <h2 className="text-lg font-bold text-text-primary mb-4">Contact Info</h2>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-text-primary">
                                    <div className={`p-2 rounded-[2px] ${theme.iconBg}`}>
                                        <Mail className="w-4 h-4" />
                                    </div>
                                    <div className="text-sm min-w-0">
                                        <p className="font-semibold text-text-primary">Email</p>
                                        <p className="truncate">{profile?.institutionalEmail || profile?.email || '—'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-text-primary">
                                    <div className={`p-2 rounded-[2px] ${theme.iconBg}`}>
                                        <Phone className="w-4 h-4" />
                                    </div>
                                    <div className="text-sm flex-1">
                                        <p className="font-semibold text-text-primary">Phone</p>
                                        {isEditing ? (
                                            <input
                                                type="tel"
                                                value={phone}
                                                onChange={e => setPhone(e.target.value)}
                                                className="w-full border-b border-gray-300 focus:border-gray-900 focus:outline-none text-text-primary bg-transparent py-0.5"
                                                placeholder="+1 (555) 000-0000"
                                            />
                                        ) : (
                                            <p>{profile?.phone || 'Not set'}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-text-primary">
                                    <div className={`p-2 rounded-[2px] ${theme.iconBg}`}>
                                        <Tag className="w-4 h-4" />
                                    </div>
                                    <div className="text-sm min-w-0">
                                        <p className="font-semibold text-text-primary">Institutional ID</p>
                                        <p className="font-mono text-xs truncate">{profile?.identifier || '—'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-text-primary">
                                    <div className={`p-2 rounded-[2px] ${theme.iconBg}`}>
                                        <Calendar className="w-4 h-4" />
                                    </div>
                                    <div className="text-sm">
                                        <p className="font-semibold text-text-primary">Member Since</p>
                                        <p>{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Role Specific Main Dashboard Widgets */}
                    <div className="md:col-span-2 space-y-6">
                        {userRole === UserRole.STUDENT && (
                            <div className="bg-surface rounded-[2px] p-8 shadow-none border border-border">
                                <h2 className="text-xl font-bold text-text-primary mb-6">Academic Overview</h2>
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="p-4 rounded-[2px] border border-violet-100 bg-background/50">
                                            <h3 className="text-sm font-bold text-violet-900 mb-1">Current GPA</h3>
                                            <p className="text-violet-700 text-2xl font-bold">3.84 / 4.00</p>
                                        </div>
                                        <div className="p-4 rounded-[2px] border border-purple-100 bg-background/50">
                                            <h3 className="text-sm font-bold text-purple-900 mb-1">Enrolled Courses</h3>
                                            <p className="text-purple-700 text-lg font-bold">6 Active Courses</p>
                                        </div>
                                    </div>
                                    <div className="pt-6 border-t border-border">
                                        <h3 className="font-bold text-text-primary mb-4">Core Interests</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {['Software Engineering', 'Data Structures', 'Web Development', 'Machine Learning'].map(tag => (
                                                <span key={tag} className="px-3 py-1 bg-background text-text-primary rounded-[2px] text-xs font-semibold border border-border uppercase ">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {userRole === UserRole.FACULTY && (
                            <div className="bg-surface rounded-[2px] p-8 shadow-none border border-border">
                                <h2 className="text-xl font-bold text-text-primary mb-6">Faculty Teaching Summary</h2>
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="p-4 rounded-[2px] border border-border bg-primary-light/50">
                                            <h3 className="text-sm font-bold text-blue-900 mb-1">Active Courses</h3>
                                            <p className="text-primary text-lg font-bold">{profile?.stats?.activeCourses ?? 0} Courses This Semester</p>
                                        </div>
                                        <div className="p-4 rounded-[2px] border border-border bg-primary-light/50">
                                            <h3 className="text-sm font-bold text-indigo-900 mb-1">Total Teaching Load</h3>
                                            <p className="text-primary text-lg font-bold">{profile?.stats?.teachingLoad ?? 0} Credit Hours</p>
                                        </div>
                                    </div>
                                    <div className="pt-6 border-t border-border">
                                        <h3 className="font-bold text-text-primary mb-4">Areas of Expertise</h3>
                                        {isEditing ? (
                                            <div className="space-y-3">
                                                <div className="flex flex-wrap gap-2">
                                                    {expertiseTags.map((tag: string) => (
                                                        <span key={tag} className="px-3 py-1 bg-primary-light text-primary rounded-[2px] text-xs font-semibold border border-primary uppercase flex items-center gap-2">
                                                            {tag}
                                                            <button onClick={() => handleRemoveExpertise(tag)} className="hover:text-red-500 font-bold">&times;</button>
                                                        </span>
                                                    ))}
                                                </div>
                                                <input
                                                    type="text"
                                                    value={expertiseInput}
                                                    onChange={e => setExpertiseInput(e.target.value)}
                                                    onKeyDown={handleAddExpertise}
                                                    placeholder="Type a skill and press Enter..."
                                                    className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-[2px] focus:border-primary focus:outline-none text-sm text-text-primary"
                                                />
                                                <p className="text-xs text-gray-500">Press Enter to add a hashtag/expertise.</p>
                                            </div>
                                        ) : (
                                            <div className="flex flex-wrap gap-2">
                                                {(profile?.tags || ['Object-Oriented Programming', 'Relational Databases', 'Discrete Mathematics']).map((tag: string) => (
                                                    <span key={tag} className="px-3 py-1 bg-background text-text-primary rounded-[2px] text-xs font-semibold border border-border uppercase ">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {userRole === UserRole.HR && (
                            <div className="bg-surface rounded-[2px] p-8 shadow-none border border-border">
                                <h2 className="text-xl font-bold text-text-primary mb-6">HR Professional Overview</h2>
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="p-4 rounded-[2px] border border-border bg-background/50">
                                            <h3 className="text-sm font-bold text-emerald-900 mb-1">Leaves Managed</h3>
                                            <p className="text-success-text text-lg font-bold">142 Requests</p>
                                        </div>
                                        <div className="p-4 rounded-[2px] border border-teal-100 bg-background/50">
                                            <h3 className="text-sm font-bold text-teal-900 mb-1">Recruitment Openings</h3>
                                            <p className="text-teal-700 text-lg font-bold">12 Active Vacancies</p>
                                        </div>
                                    </div>
                                    <div className="pt-6 border-t border-border">
                                        <h3 className="font-bold text-text-primary mb-4">Core Responsibilities</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {['Staff Recruitment', 'Leave Review', 'Payroll Verification', 'Employee Relations'].map(tag => (
                                                <span key={tag} className="px-3 py-1 bg-background text-text-primary rounded-[2px] text-xs font-semibold border border-border uppercase ">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {userRole === UserRole.ADMIN && (
                            <div className="bg-surface rounded-[2px] p-8 shadow-none border border-border">
                                <h2 className="text-xl font-bold text-text-primary mb-6">Administrative Control Overview</h2>
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="p-4 rounded-[2px] border border-border bg-surface-hover/50">
                                            <h3 className="text-sm font-bold text-text-primary mb-1">Total Users Managed</h3>
                                            <p className="text-primary text-lg font-bold">{profile?.stats?.activeUsers?.toLocaleString() || '0'} Users</p>
                                        </div>
                                        <div className="p-4 rounded-[2px] border border-border bg-surface-hover/50">
                                            <h3 className="text-sm font-bold text-text-primary mb-1">Active Departments</h3>
                                            <p className="text-primary text-lg font-bold">{profile?.stats?.activeDepartments || '0'} Divisions</p>
                                        </div>
                                    </div>
                                    <div className="pt-6 border-t border-border">
                                        <h3 className="font-bold text-text-primary mb-4">Access Credentials</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {['Global Override Access', 'Full DB Access', 'Timetable Planning', 'System Configuration Control'].map(tag => (
                                                <span key={tag} className="px-3 py-1 bg-background text-text-primary rounded-[2px] text-xs font-semibold border border-border uppercase ">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

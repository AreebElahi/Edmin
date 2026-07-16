'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { UserRole } from '@/types/types';
import { 
    Settings2, Server, ShieldCheck, Database, Bot, 
    ToggleLeft, ToggleRight, Download, Activity, AlertTriangle, Key,
    Power, RotateCcw, Clock, ShieldAlert, Cpu, History, CircleDot,
    CheckCircle2, XCircle
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { apiGet } from '@/api/apiContract';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { 
    useSystemConfig, 
    useUpdateSystemConfig, 
    useActiveSessions, 
    useTerminateSession, 
    useBackupSnapshots, 
    useCreateBackup, 
    useRestoreBackup,
    useGlobalAuditLogs
} from '@/features/settings/hooks/useSettings';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminStatusBadge from '@/components/admin/AdminStatusBadge';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';

export default function GlobalSettingsPage() {
    const { data: currentUser } = useCurrentUser();
    const [activeTab, setActiveTab] = useState<'system' | 'security' | 'backup' | 'ai' | 'roles'>('system');
    const [quizMetadata, setQuizMetadata] = useState<any>(null);
    const [loadingQuizMeta, setLoadingQuizMeta] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const tab = params.get('tab');
            if (tab && ['system', 'security', 'backup', 'ai', 'roles'].includes(tab)) {
                setActiveTab(tab as any);
            }
        }
    }, []);
    
    // React Query Hooks
    const { data: config, isLoading: isLoadingConfig } = useSystemConfig();
    const updateConfigMutation = useUpdateSystemConfig();

    const { data: activeSessions = [], isLoading: isLoadingSessions } = useActiveSessions();
    const terminateSessionMutation = useTerminateSession();

    const { data: backups = [], isLoading: isLoadingBackups } = useBackupSnapshots();
    const createBackupMutation = useCreateBackup();
    const restoreBackupMutation = useRestoreBackup();

    // Local form states
    const [instName, setInstName] = useState('');
    const [supportEmail, setSupportEmail] = useState('');
    const [uploadLimit, setUploadLimit] = useState('');
    const [attendanceThreshold, setAttendanceThreshold] = useState(75);
    const [quizQuestions, setQuizQuestions] = useState(50);
    const [minCredits, setMinCredits] = useState(9);
    const [maxCredits, setMaxCredits] = useState(18);

    useEffect(() => {
        if (config) {
            setInstName(config.institutionName || '');
            setSupportEmail(config.supportContactEmail || '');
            setUploadLimit(config.maxUploadSizeLimit || '50 MB');
            setAttendanceThreshold(config.globalAttendanceThreshold ?? 75);
            setQuizQuestions(config.maxQuizQuestions ?? 50);
            setMinCredits(config.minimumTeachingCredits ?? 9);
            setMaxCredits(config.maximumTeachingCredits ?? 18);
        }
    }, [config]);

    useEffect(() => {
        if (activeTab === 'ai') {
            setLoadingQuizMeta(true);
            apiGet<any>('/admin/quizzes/metadata')
                .then(data => {
                    setQuizMetadata(data);
                })
                .catch(err => {
                    console.error('Failed to load quiz metadata', err);
                })
                .finally(() => {
                    setLoadingQuizMeta(false);
                });
        }
    }, [activeTab]);

    const handleToggleMaintenance = () => {
        if (!config) return;
        updateConfigMutation.mutate({
            maintenanceMode: !config.maintenanceMode
        });
    };

    const handleToggleAI = () => {
        if (!config) return;
        updateConfigMutation.mutate({
            aiEnabled: !config.aiEnabled
        });
    };

    const handleSaveSystemConfig = (e: React.FormEvent) => {
        e.preventDefault();
        updateConfigMutation.mutate({
            institutionName: instName,
            supportContactEmail: supportEmail,
            maxUploadSizeLimit: uploadLimit,
            globalAttendanceThreshold: Number(attendanceThreshold),
            minimumTeachingCredits: Number(minCredits),
            maximumTeachingCredits: Number(maxCredits)
        });
    };

    const handleSaveAIConfig = (e: React.FormEvent) => {
        e.preventDefault();
        updateConfigMutation.mutate({
            maxQuizQuestions: Number(quizQuestions)
        });
    };

    const handleTerminate = (id: number) => {
        if (confirm(`Are you sure you want to force terminate session #${id}?`)) {
            terminateSessionMutation.mutate(id);
        }
    };

    const handleCreateBackup = () => {
        createBackupMutation.mutate();
    };

    const handleRestoreBackup = (id: string) => {
        if (confirm(`Are you sure you want to restore point-in-time snapshot ${id}? This will disrupt active operations.`)) {
            restoreBackupMutation.mutate(id);
        }
    };

    const maintenanceMode = config?.maintenanceMode || false;
    const aiEnabled = config?.aiEnabled ?? true;

    const { data: auditLogs = [], isLoading: isLoadingAuditLogs } = useGlobalAuditLogs();

    return (
        <DashboardLayout userRole={UserRole.ADMIN} userName={currentUser?.fullName || 'Admin'} notifications={[]}>
            <AdminPageWrapper>
                
                {/* Header Sub-Nav */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-semibold  text-text-primary flex items-center gap-3"><Settings2 className="w-8 h-8 text-text-secondary"/> Infrastructure & Settings</h1>
                        <p className="text-text-secondary mt-1 font-medium">Global university parameters, security governance, and system operations.</p>
                    </div>
                    <div className="flex gap-3">
                        {maintenanceMode && <div className="bg-error-bg border border-rose-200 text-error-text font-bold px-4 py-2 rounded-[2px] flex items-center gap-2 "><AlertTriangle className="w-4 h-4"/> Maintenance Active</div>}
                        <button 
                            onClick={handleToggleMaintenance} 
                            disabled={updateConfigMutation.isPending || isLoadingConfig}
                            className={`${maintenanceMode ? 'bg-slate-900 shadow-slate-300' : 'bg-rose-600 shadow-rose-200'} hover:opacity-90 text-white font-semibold px-6 py-2.5 rounded-[2px] shadow-none transition-all flex items-center gap-2`}
                        >
                            <Power className="w-4 h-4"/> {updateConfigMutation.isPending ? 'Processing...' : (maintenanceMode ? 'Restore Normal Ops' : 'Enable Maintenance Ops')}
                        </button>
                    </div>
                </div>

                {/* Sub-navigation Tabs */}
                <div className="flex flex-wrap gap-2 mb-8 bg-surface p-2 rounded-[2px] shadow-none border border-border w-fit">
                    <button onClick={() => setActiveTab('system')} className={`px-5 py-2.5 font-bold text-sm rounded-[2px] transition-all flex items-center gap-2 ${activeTab === 'system' ? 'bg-slate-800 text-white shadow-none' : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover border border-transparent'}`}><Server className="w-4 h-4"/> Global Config</button>
                    <button onClick={() => setActiveTab('security')} className={`px-5 py-2.5 font-bold text-sm rounded-[2px] transition-all flex items-center gap-2 ${activeTab === 'security' ? 'bg-error-bg text-error-text shadow-none border border-border' : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover border border-transparent'}`}><ShieldCheck className="w-4 h-4"/> Security & Audit</button>
                    <button onClick={() => setActiveTab('backup')} className={`px-5 py-2.5 font-bold text-sm rounded-[2px] transition-all flex items-center gap-2 ${activeTab === 'backup' ? 'bg-background text-success-text shadow-none border border-border' : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover border border-transparent'}`}><Database className="w-4 h-4"/> Backup & Restore</button>
                    <button onClick={() => setActiveTab('ai')} className={`px-5 py-2.5 font-bold text-sm rounded-[2px] transition-all flex items-center gap-2 ${activeTab === 'ai' ? 'bg-background text-purple-700 shadow-none border border-purple-100' : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover border border-transparent'}`}><Bot className="w-4 h-4"/> AI Controllers</button>
                    <button onClick={() => setActiveTab('roles')} className={`px-5 py-2.5 font-bold text-sm rounded-[2px] transition-all flex items-center gap-2 ${activeTab === 'roles' ? 'bg-primary-light text-primary shadow-none border border-border' : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover border border-transparent'}`}><Key className="w-4 h-4"/> Permission Matrix</button>
                </div>

                <div className="bg-surface rounded-[2px] p-6 md:p-8 shadow-none border border-border animate-in fade-in slide-in-from-bottom-4">
                    
                    {/* SYSTEM CONFIG */}
                    {activeTab === 'system' && (
                        <form onSubmit={handleSaveSystemConfig} className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            {isLoadingConfig ? (
                                <div className="col-span-2 text-center py-12 text-text-secondary font-medium">Loading settings configurations...</div>
                            ) : (
                                <>
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-lg font-bold text-text-primary mb-4 border-b border-border pb-2">University Branding</h3>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="text-xs font-bold text-text-secondary uppercase tracking-widest block mb-1">Institution Name</label>
                                                    <input type="text" value={instName} onChange={e => setInstName(e.target.value)} className="w-full bg-surface-hover border border-border rounded-[2px] p-3 font-medium text-text-primary outline-none focus:border-slate-400" />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-text-secondary uppercase tracking-widest block mb-1">Support Contact Email</label>
                                                    <input type="email" value={supportEmail} onChange={e => setSupportEmail(e.target.value)} className="w-full bg-surface-hover border border-border rounded-[2px] p-3 font-medium text-text-primary outline-none focus:border-slate-400" />
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-text-primary mb-4 border-b border-border pb-2">File Infrastructure</h3>
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center bg-surface-hover p-4 rounded-[2px] border border-border">
                                                    <div>
                                                        <p className="font-bold text-text-primary">Max Upload Size limit</p>
                                                        <p className="text-xs text-text-secondary">Restricts student assignment upload payload.</p>
                                                    </div>
                                                    <select value={uploadLimit} onChange={e => setUploadLimit(e.target.value)} className="bg-surface border border-border rounded-[2px] p-2 font-bold text-sm bg-surface">
                                                        <option value="50 MB">50 MB</option>
                                                        <option value="100 MB">100 MB</option>
                                                        <option value="500 MB">500 MB</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-lg font-bold text-text-primary mb-4 border-b border-border pb-2">Academic Core Logic</h3>
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center bg-surface-hover p-4 rounded-[2px] border border-border">
                                                    <div>
                                                        <p className="font-bold text-text-primary">Global Attendance Threshold</p>
                                                        <p className="text-xs text-text-secondary">Minimum % required before automatic default.</p>
                                                    </div>
                                                    <input type="number" value={attendanceThreshold} onChange={e => setAttendanceThreshold(Number(e.target.value))} className="w-20 bg-surface border border-border rounded-[2px] p-2 font-bold text-center text-error-text bg-surface"/>
                                                </div>
                                                <div className="flex justify-between items-center bg-surface-hover p-4 rounded-[2px] border border-border">
                                                    <div>
                                                        <p className="font-bold text-text-primary">Minimum Teaching Credits</p>
                                                        <p className="text-xs text-text-secondary">Minimum credits a faculty member should teach.</p>
                                                    </div>
                                                    <input type="number" value={minCredits} onChange={e => setMinCredits(Number(e.target.value))} className="w-20 bg-surface border border-border rounded-[2px] p-2 font-bold text-center text-primary bg-surface"/>
                                                </div>
                                                <div className="flex justify-between items-center bg-surface-hover p-4 rounded-[2px] border border-border">
                                                    <div>
                                                        <p className="font-bold text-text-primary">Maximum Teaching Credits</p>
                                                        <p className="text-xs text-text-secondary">Maximum credits allowed per faculty member.</p>
                                                    </div>
                                                    <input type="number" value={maxCredits} onChange={e => setMaxCredits(Number(e.target.value))} className="w-20 bg-surface border border-border rounded-[2px] p-2 font-bold text-center text-primary bg-surface"/>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="pt-6">
                                            <button type="submit" disabled={updateConfigMutation.isPending} className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-[2px] transition-all">
                                                {updateConfigMutation.isPending ? 'Saving Parameters...' : 'Save Configuration Parameters'}
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </form>
                    )}

                    {/* SECURITY & AUDIT */}
                    {activeTab === 'security' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            {/* Audit Log */}
                            <div>
                                <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2"><History className="w-5 h-5 text-text-muted"/> Immutable Audit Trail</h3>
                                <p className="text-xs font-bold text-rose-500 uppercase tracking-widest mb-4 bg-error-bg inline-block px-2 py-1 rounded">System Default: Logs cannot be deleted</p>
                                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                                    {isLoadingAuditLogs ? (
                                        <div className="text-center py-6 text-text-secondary font-medium">Loading audit trail...</div>
                                    ) : auditLogs.map((log: any) => (
                                        <div key={log.id} className="border border-border rounded-[2px] p-4 hover:bg-surface-hover transition-colors">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className={`text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded ${log.severity === 'Critical' ? 'bg-error-bg text-error-text' : log.severity === 'Warning' ? 'bg-warning-bg text-warning-text' : 'bg-background text-text-secondary'}`}>{log.severity}</span>
                                                <span className="text-xs font-bold text-text-muted">{log.time}</span>
                                            </div>
                                            <p className="font-bold text-text-primary text-sm mb-1">{log.event}</p>
                                            <p className="text-xs text-text-secondary">Triggered by: <span className="font-bold text-text-primary">{log.user}</span></p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Active Sessions */}
                            <div>
                                <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-emerald-500"/> Live Network Sessions</h3>
                                <div className="space-y-3">
                                    {isLoadingSessions ? (
                                        <div className="text-center py-6 text-text-secondary font-medium">Loading active sessions...</div>
                                    ) : (
                                        activeSessions.map((session, idx) => (
                                            <div key={idx} className="bg-surface-hover border border-border rounded-[2px] p-4 flex justify-between items-center">
                                                <div>
                                                    <p className="font-bold text-text-primary flex items-center gap-2">{session.user} <span className="text-[10px] bg-slate-200 text-text-secondary px-1 py-0.5 rounded uppercase font-semibold">{session.type}</span></p>
                                                    <div className="flex gap-4 mt-1 text-xs text-text-secondary">
                                                        <span>IP: {session.ip}</span>
                                                        <span>{session.device}</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    <span className={`text-[10px] uppercase font-semibold flex items-center gap-1 ${session.time.includes('Active') ? 'text-emerald-500' : 'text-amber-500'}`}><CircleDot className="w-3 h-3"/> {session.time}</span>
                                                    <button onClick={() => handleTerminate(session.id)} disabled={terminateSessionMutation.isPending} className="text-[10px] font-semibold uppercase text-error-text hover:underline">Force Terminate</button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* BACKUP & RESTORE */}
                    {activeTab === 'backup' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-1 border-r border-border pr-8">
                                <h3 className="text-lg font-bold text-text-primary mb-2">Disaster Recovery</h3>
                                <p className="text-sm text-text-secondary mb-8">Execute manual snapshots outside of the daily scheduled Cron jobs.</p>
                                
                                <button 
                                    onClick={handleCreateBackup} 
                                    disabled={createBackupMutation.isPending}
                                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-4 rounded-[2px] shadow-none flex flex-col items-center justify-center gap-2 transition-all disabled:bg-surface-hover0"
                                >
                                    <Database className="w-8 h-8 opacity-80"/>
                                    {createBackupMutation.isPending ? 'Backing Up...' : 'Trigger Manual Backup'}
                                </button>
                                <div className="mt-4 bg-background border border-border text-emerald-800 text-xs p-4 rounded-[2px] text-center">
                                    <b>Cron Sync:</b> Scheduled Daily at 02:00 AM UTC
                                </div>
                            </div>
                            <div className="lg:col-span-2">
                                <h3 className="text-lg font-bold text-text-primary mb-4">Cryptographic Snapshots</h3>
                                {isLoadingBackups ? (
                                    <div className="text-center py-6 text-text-secondary font-medium">Loading backups list...</div>
                                ) : (
                                    <table className="w-full text-left text-sm text-text-secondary border-separate border-spacing-y-3">
                                        <thead><tr><th className="px-4 text-[10px] uppercase font-semibold text-text-muted">Creation Date</th><th className="px-4 text-[10px] uppercase font-semibold text-text-muted">Trigger Type</th><th className="px-4 text-[10px] uppercase font-semibold text-text-muted text-right">Actions</th></tr></thead>
                                        <tbody>
                                            {backups.map(bk => (
                                                <tr key={bk.id} className="bg-surface-hover hover:bg-background transition-colors">
                                                    <td className="px-4 py-3 rounded-l-xl font-bold text-text-primary">{bk.date} <span className="block text-xs font-normal text-text-secondary">Size: {bk.size} / {bk.id}</span></td>
                                                    <td className="px-4 py-3"><span className="bg-surface border border-border text-[10px] font-semibold uppercase text-text-secondary px-2 py-1 rounded">{bk.type}</span></td>
                                                    <td className="px-4 py-3 rounded-r-xl text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button onClick={() => alert(`Downloading archive: ${bk.id}.zip`)} className="bg-surface border border-border p-2 rounded-[2px] hover:text-primary transition-colors" title="Download Archive"><Download className="w-4 h-4"/></button>
                                                            <button 
                                                                onClick={() => handleRestoreBackup(bk.id)} 
                                                                disabled={restoreBackupMutation.isPending}
                                                                className="bg-error-bg text-error-text border border-border p-2 rounded-[2px] hover:bg-rose-600 hover:text-white transition-colors" 
                                                                title="Force Point-in-time Restore"
                                                            >
                                                                <RotateCcw className="w-4 h-4"/>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    )}

                    {/* AI CONTROLLERS */}
                    {activeTab === 'ai' && (
                        <div className="space-y-8">
                            <div className="flex flex-col md:flex-row justify-between items-center bg-background border border-purple-100 p-6 rounded-[2px] gap-4">
                                <div>
                                    <h3 className="text-xl font-semibold text-purple-900 flex items-center gap-2"><Cpu className="w-6 h-6"/> Global AI Subsystem Status</h3>
                                    <p className="text-sm text-purple-700 mt-1">Controls the NLP Chatbot, Plagiarism Engine, and Adaptive Quiz Generative routines.</p>
                                </div>
                                <button 
                                    onClick={handleToggleAI} 
                                    disabled={updateConfigMutation.isPending}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-[2px] font-semibold text-sm transition-all shadow-none ${aiEnabled ? 'bg-purple-600 text-white' : 'bg-slate-300 text-text-secondary'}`}
                                >
                                    {aiEnabled ? <><ToggleRight className="w-5 h-5"/> ENABLED</> : <><ToggleLeft className="w-5 h-5"/> OFFLINE</>}
                                </button>
                            </div>

                            <form onSubmit={handleSaveAIConfig} className={`grid grid-cols-1 md:grid-cols-2 gap-6 transition-opacity ${!aiEnabled ? 'opacity-40 pointer-events-none' : ''}`}>
                                <div className="border border-border rounded-[2px] p-6">
                                    <h4 className="font-bold text-text-primary mb-4 border-b border-border pb-2">Quiz Generator Limits</h4>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="font-bold text-text-secondary">Max Questions per Generation</span>
                                            <input type="number" value={quizQuestions} onChange={e => setQuizQuestions(Number(e.target.value))} className="w-16 border border-border rounded-[2px] p-1 text-center font-bold outline-none bg-surface"/>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="font-bold text-text-secondary">Allowed LLM Tokens/Day</span>
                                            <span className="bg-background px-2 py-1 rounded font-semibold text-text-secondary">1.2M Tokens</span>
                                        </div>
                                    </div>
                                    <div className="mt-6">
                                        <button type="submit" disabled={updateConfigMutation.isPending} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded-[2px] transition-all">
                                            Save AI Thresholds
                                        </button>
                                    </div>
                                </div>

                                <div className="border border-border rounded-[2px] p-6">
                                    <h4 className="font-bold text-text-primary mb-4 border-b border-border pb-2">Plagiarism Engine Configuration</h4>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="font-bold text-text-secondary">Strict Match Tolerance (%)</span>
                                            <input type="number" defaultValue="15" className="w-16 border border-border rounded-[2px] p-1 text-center font-bold text-rose-500 outline-none bg-surface"/>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="font-bold text-text-secondary">Auto-flag on violation</span>
                                            <input type="checkbox" defaultChecked className="w-4 h-4 text-primary rounded"/>
                                        </div>
                                    </div>
                                </div>
                            </form>

                            {/* Live AI Metrics Section */}
                            <div className="border border-border rounded-[2px] p-6 bg-surface-hover/50 mt-8 space-y-6">
                                <div className="flex items-center gap-3">
                                    <Cpu className="w-5 h-5 text-primary" />
                                    <h4 className="font-semibold text-text-primary uppercase tracking-wider text-sm">Real-time Generative Quiz Audit Logs</h4>
                                </div>

                                {loadingQuizMeta ? (
                                    <div className="text-center py-8 text-text-secondary font-medium">Loading live AI metadata metrics...</div>
                                ) : !quizMetadata || quizMetadata.logs.length === 0 ? (
                                    <p className="text-xs text-text-muted italic">No AI-generated quizzes have been audited yet.</p>
                                ) : (
                                    <div className="space-y-6">
                                        {/* Stats Cards */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div className="bg-surface border border-border rounded-[2px] p-4 shadow-none text-center">
                                                <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest">Total Generated</p>
                                                <p className="text-2xl font-semibold text-primary mt-1">{quizMetadata.stats.totalCount}</p>
                                            </div>
                                            <div className="bg-surface border border-border rounded-[2px] p-4 shadow-none text-center">
                                                <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest">Avg Questions/Quiz</p>
                                                <p className="text-2xl font-semibold text-primary mt-1">{quizMetadata.stats.avgQuestions}</p>
                                            </div>
                                            <div className="bg-surface border border-border rounded-[2px] p-4 shadow-none text-center flex flex-col justify-center">
                                                <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest">Difficulty Distribution</p>
                                                <p className="text-[11px] font-semibold text-text-primary mt-1">
                                                    Easy: {quizMetadata.stats.difficultyDistribution.EASY} | Med: {quizMetadata.stats.difficultyDistribution.MEDIUM} | Hard: {quizMetadata.stats.difficultyDistribution.HARD}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Audit Logs Table */}
                                        <div className="bg-surface border border-border rounded-[2px] overflow-hidden shadow-none">
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left text-xs border-collapse">
                                                    <thead className="bg-surface-hover text-text-muted uppercase font-semibold tracking-wider border-b border-border">
                                                        <tr>
                                                            <th className="py-3 px-4">Quiz Title</th>
                                                            <th className="py-3 px-4">Course</th>
                                                            <th className="py-3 px-4">Topic / Difficulty</th>
                                                            <th className="py-3 px-4 text-center">Questions</th>
                                                            <th className="py-3 px-4">Generator</th>
                                                            <th className="py-3 px-4 text-right">Timestamp</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-50">
                                                        {quizMetadata.logs.map((log: any) => (
                                                            <tr key={log.quizid} className="hover:bg-surface-hover/50 transition-colors">
                                                                <td className="py-3 px-4 font-bold text-text-primary">{log.title}</td>
                                                                <td className="py-3 px-4">
                                                                    <p className="font-semibold text-text-primary">{log.courseName}</p>
                                                                    <p className="text-[9px] text-text-muted font-mono">{log.courseCode}</p>
                                                                </td>
                                                                <td className="py-3 px-4">
                                                                    <span className="bg-background text-purple-700 border border-purple-100 px-1.5 py-0.5 rounded text-[10px] font-bold">{log.topic}</span>
                                                                    <span className="ml-1.5 bg-background text-text-secondary border border-border px-1.5 py-0.5 rounded text-[10px] font-bold">{log.difficulty}</span>
                                                                </td>
                                                                <td className="py-3 px-4 text-center font-bold text-text-primary">{log.questionCount}</td>
                                                                <td className="py-3 px-4 font-medium text-text-secondary">{log.instructor}</td>
                                                                <td className="py-3 px-4 text-right text-text-muted font-mono">{new Date(log.generatedAt).toLocaleString()}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* PERMISSION MATRIX */}
                    {activeTab === 'roles' && (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-text-primary">Granular Role Permission Matrix</h2>
                                    <p className="text-sm text-text-secondary mt-1">Define what each role CAN and CANNOT do across the system.</p>
                                </div>
                            </div>

                            {/* Permission Grid */}
                            <div className="overflow-x-auto rounded-[2px] border border-border">
                                <table className="w-full text-left text-sm min-w-[700px]">
                                    <thead className="bg-surface-hover text-text-secondary text-[10px] uppercase tracking-widest font-semibold">
                                        <tr>
                                            <th className="px-6 py-4 border-r border-border">Permission / Capability</th>
                                            <th className="px-4 py-4 text-center">Superadmin</th>
                                            <th className="px-4 py-4 text-center">HR Manager</th>
                                            <th className="px-4 py-4 text-center">Faculty</th>
                                            <th className="px-4 py-4 text-center">HOD</th>
                                            <th className="px-4 py-4 text-center">Student</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-surface">
                                        {[
                                            { label: 'Manage Users (Create/Delete)', admin: true, hr: true, faculty: false, hod: false, student: false },
                                            { label: 'Bulk CSV Import Users', admin: true, hr: true, faculty: false, hod: false, student: false },
                                            { label: 'Activate / Deactivate Accounts', admin: true, hr: true, faculty: false, hod: false, student: false },
                                            { label: 'View All Departments', admin: true, hr: true, faculty: true, hod: true, student: false },
                                            { label: 'Edit Department & HOD', admin: true, hr: false, faculty: false, hod: false, student: false },
                                            { label: 'Create / Edit Courses', admin: true, hr: false, faculty: false, hod: true, student: false },
                                            { label: 'Manage Semester Rollover', admin: true, hr: false, faculty: false, hod: false, student: false },
                                            { label: 'Assign Teachers to Sections', admin: true, hr: false, faculty: false, hod: true, student: false },
                                            { label: 'Approve Leave Requests', admin: true, hr: true, faculty: false, hod: true, student: false },
                                            { label: 'View Audit Logs', admin: true, hr: false, faculty: false, hod: false, student: false },
                                            { label: 'Delete/Remove Content', admin: true, hr: false, faculty: false, hod: false, student: false },
                                            { label: 'Send Global Broadcasts', admin: true, hr: false, faculty: false, hod: false, student: false },
                                            { label: 'Submit Complaints', admin: false, hr: false, faculty: true, hod: true, student: true },
                                            { label: 'Upload Course Materials', admin: false, hr: false, faculty: true, hod: true, student: false },
                                            { label: 'Use AI Quiz Generator', admin: false, hr: false, faculty: true, hod: true, student: false },
                                            { label: 'Toggle AI System On/Off', admin: true, hr: false, faculty: false, hod: false, student: false },
                                            { label: 'Trigger Manual Backup', admin: true, hr: false, faculty: false, hod: false, student: false },
                                        ].map((perm, i) => (
                                            <tr key={i} className="hover:bg-surface-hover transition-colors">
                                                <td className="px-6 py-3 font-medium text-text-primary border-r border-border">{perm.label}</td>
                                                {[perm.admin, perm.hr, perm.faculty, perm.hod, perm.student].map((allowed, j) => (
                                                    <td key={j} className="px-4 py-3 text-center">
                                                        {allowed 
                                                            ? <span className="inline-flex items-center justify-center w-6 h-6 bg-background rounded-[2px]"><CheckCircle2 className="w-4 h-4 text-success-text"/></span>
                                                            : <span className="inline-flex items-center justify-center w-6 h-6 bg-error-bg rounded-[2px]"><XCircle className="w-4 h-4 text-rose-300"/></span>
                                                        }
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                </div>
            </AdminPageWrapper>
        </DashboardLayout>
    );
}

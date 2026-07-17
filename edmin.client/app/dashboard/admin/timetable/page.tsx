'use client';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';
import DashboardLayout from '@/components/DashboardLayout';
import { UserRole } from '@/types/types';
import { 
    CalendarDays, AlertTriangle, CheckCircle2, History, MapPin, 
    Save, Send, Filter, GripHorizontal, Eye, ShieldAlert, PlusCircle, Archive, Trash2, Printer, Edit2
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import Modal from '@/components/Modal';
import ConfirmModal from '@/components/ConfirmModal';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { 
    useRooms, 
    useCreateRoom, 
    useTimetableSlots, 
    useCreateTimetableSlot, 
    useDeleteTimetableSlot, 
    useTimetableVersions, 
    usePublishTimetable,
    useTimetableOfferings,
    useTimetablePrograms,
    useUpdateTimetableSlot,
    useDeleteRoom
} from '@/features/timetable/hooks/useTimetable';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminStatusBadge from '@/components/admin/AdminStatusBadge';
import AdminTabBar from '@/components/admin/AdminTabBar';

export default function TimetableManagementPage() {
    const { data: currentUser } = useCurrentUser();
    const [activeTab, setActiveTab] = useState<'builder' | 'venues' | 'versions'>('builder');
    const [versionStatus, setVersionStatus] = useState<'Draft' | 'Published'>('Draft');
    const [isAddSlotModalOpen, setIsAddSlotModalOpen] = useState(false);
    const [isAddVenueModalOpen, setIsAddVenueModalOpen] = useState(false);
    const [editingSlotId, setEditingSlotId] = useState<number | null>(null);

    // Confirm delete modal state
    const [confirmModal, setConfirmModal] = useState<{
        open: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({ open: false, title: '', message: '', onConfirm: () => {} });

    const openConfirm = useCallback((title: string, message: string, onConfirm: () => void) => {
        setConfirmModal({ open: true, title, message, onConfirm });
    }, []);

    const closeConfirm = useCallback(() => {
        setConfirmModal(prev => ({ ...prev, open: false }));
    }, []);

    // Selected program and section states
    const [selectedProgramId, setSelectedProgramId] = useState<number | null>(null);
    const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);

    // Selected day/time states for modal
    const [selectedDay, setSelectedDay] = useState('Monday');
    const [selectedTime, setSelectedTime] = useState('08:00 AM');

    // Form inputs for new slot
    const [formOfferingId, setFormOfferingId] = useState('');
    const [formRoomId, setFormRoomId] = useState('');

    // Form inputs for new venue
    const [venueName, setVenueName] = useState('');
    const [venueCode, setVenueCode] = useState('');
    const [venueCapacity, setVenueCapacity] = useState('40');
    const [venueBuilding, setVenueBuilding] = useState('');

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const timeSlots = ['08:00 AM', '09:30 AM', '11:00 AM', '12:30 PM', '02:00 PM', '03:30 PM'];

    const timeMappings: Record<string, { start: string, end: string }> = {
        '08:00 AM': { start: '1970-01-01T08:00:00.000Z', end: '1970-01-01T09:30:00.000Z' },
        '09:30 AM': { start: '1970-01-01T09:30:00.000Z', end: '1970-01-01T11:00:00.000Z' },
        '11:00 AM': { start: '1970-01-01T11:00:00.000Z', end: '1970-01-01T12:30:00.000Z' },
        '12:30 PM': { start: '1970-01-01T12:30:00.000Z', end: '1970-01-01T14:00:00.000Z' },
        '02:00 PM': { start: '1970-01-01T14:00:00.000Z', end: '1970-01-01T15:30:00.000Z' },
        '03:30 PM': { start: '1970-01-01T15:30:00.000Z', end: '1970-01-01T17:00:00.000Z' }
    };

    // React Query Hooks
    const { data: roomsList = [], isLoading: isLoadingRooms } = useRooms();
    const { data: slotsList = [], isLoading: isLoadingSlots } = useTimetableSlots();
    const { data: versionsList = [], isLoading: isLoadingVersions } = useTimetableVersions();
    const { data: programsList = [], isLoading: isLoadingPrograms } = useTimetablePrograms();

    const createRoomMutation = useCreateRoom();
    const deleteRoomMutation = useDeleteRoom();
    const createSlotMutation = useCreateTimetableSlot();
    const updateSlotMutation = useUpdateTimetableSlot();
    const deleteSlotMutation = useDeleteTimetableSlot();
    const publishTimetableMutation = usePublishTimetable();

    // React Query hook for dynamic course offerings
    const { data: offeringsList = [], isLoading: isLoadingOfferings } = useTimetableOfferings();

    // Set initial program and section selection when programsList is loaded
    useEffect(() => {
        if (programsList.length > 0) {
            if (selectedProgramId === null) {
                const defaultProg = programsList[0];
                setSelectedProgramId(defaultProg.programid);
                if (defaultProg.section && defaultProg.section.length > 0) {
                    setSelectedSectionId(defaultProg.section[0].sectionid);
                }
            }
        }
    }, [programsList, selectedProgramId]);

    function formatSlotTime(timeStr: string) {
        const d = new Date(timeStr);
        let hours = d.getUTCHours();
        const minutes = d.getUTCMinutes();
        
        if (isNaN(hours)) {
            const match = timeStr.match(/(\d{2}):(\d{2})/);
            if (match) {
                hours = parseInt(match[1], 10);
                const mm = match[2];
                const ampm = hours >= 12 ? 'PM' : 'AM';
                const h = hours % 12 || 12;
                return `${h < 10 ? '0' + h : h}:${mm} ${ampm}`;
            }
            return '08:00 AM';
        }
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const h = hours % 12 || 12;
        const mm = minutes < 10 ? '0' + minutes : minutes;
        return `${h < 10 ? '0' + h : h}:${mm} ${ampm}`;
    }

    // Format slots list to grid map
    const gridData: Record<string, Record<string, any>> = {};
    const filteredSlots = slotsList.filter(slot => {
        if (!selectedSectionId) return false;
        return slot.sectionId === selectedSectionId;
    });

    filteredSlots.forEach(slot => {
        const formattedDay = slot.dayOfWeek.charAt(0) + slot.dayOfWeek.slice(1).toLowerCase();
        const formattedTime = formatSlotTime(slot.startTime);
        
        if (!gridData[formattedDay]) {
            gridData[formattedDay] = {};
        }
        gridData[formattedDay][formattedTime] = {
            id: slot.slotId,
            course: slot.course,
            teacher: slot.teacher,
            room: slot.room,
            conflict: false
        };
    });

    const handlePublish = () => {
        openConfirm(
            'Publish Timetable',
            'Are you sure you want to publish this timetable? This will override student and faculty schedules globally.',
            () => {
                closeConfirm();
                if (versionsList.length > 0) {
                    publishTimetableMutation.mutate(versionsList[0].timetableid, {
                        onSuccess: () => {
                            setVersionStatus('Published');
                        }
                    });
                } else {
                    setVersionStatus('Published');
                }
            }
        );
    };

    const handleAddSlotSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const mapping = timeMappings[selectedTime];
        if (!mapping || !formRoomId || !selectedSectionId) return;

        const payload = {
            offeringId: Number(formOfferingId),
            sectionId: selectedSectionId,
            roomId: Number(formRoomId),
            dayOfWeek: selectedDay.toUpperCase(),
            startTime: mapping.start,
            endTime: mapping.end
        };

        if (editingSlotId) {
            updateSlotMutation.mutate({ id: editingSlotId, data: payload }, {
                onSuccess: () => {
                    setIsAddSlotModalOpen(false);
                    setEditingSlotId(null);
                }
            });
        } else {
            createSlotMutation.mutate(payload, {
                onSuccess: () => {
                    setIsAddSlotModalOpen(false);
                }
            });
        }
    };

    const handleAddVenueSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!venueName || !venueCode) return;

        createRoomMutation.mutate({
            name: venueName,
            code: venueCode,
            capacity: Number(venueCapacity),
            building: venueBuilding
        }, {
            onSuccess: () => {
                setIsAddVenueModalOpen(false);
                setVenueName('');
                setVenueCode('');
                setVenueCapacity('40');
                setVenueBuilding('');
            }
        });
    };

    return (
        <DashboardLayout userRole={UserRole.ADMIN} userName={currentUser?.fullName || 'Admin'} notifications={[]}>
            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #printable-grid, #printable-grid * {
                        visibility: visible;
                    }
                    #printable-grid {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        margin: 0;
                        padding: 20px;
                    }
                    .no-print {
                        display: none !important;
                    }
                }
            `}</style>
            <AdminPageWrapper>
                
                {/* Header */}
                <AdminPageHeader
                    icon={CalendarDays}
                    title="Master Timetable Engine"
                    subtitle="Visual scheduling, conflict detection, and global version publishing."
                    actions={
                        <div className="flex gap-2 w-full sm:w-auto">
                            {versionStatus === 'Draft' && (
                                <button onClick={handlePublish} disabled={publishTimetableMutation.isPending} className="flex items-center gap-1.5 px-4 py-2 bg-white text-primary hover:bg-slate-100 rounded-[2px] text-sm font-semibold transition-colors no-print w-full sm:w-auto justify-center">
                                    <Send className="w-4 h-4"/> {publishTimetableMutation.isPending ? 'Publishing...' : 'Publish Globally'}
                                </button>
                            )}
                            <button onClick={() => window.print()} className="flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-[2px] text-sm font-semibold transition-colors w-full sm:w-auto justify-center">
                                <Printer className="w-4 h-4"/> Print
                            </button>
                        </div>
                    }
                />

                {/* Navigation Tabs */}
                <AdminTabBar
                    tabs={[
                        { id: 'builder', label: 'Sandbox Builder' },
                        { id: 'venues', label: 'Venues & Rooms' },
                        { id: 'versions', label: 'Version Control' }
                    ]}
                    activeTab={activeTab}
                    onTabChange={(id) => setActiveTab(id as any)}
                />

                {/* TAB: BUILDER */}
                {activeTab === 'builder' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex gap-4">
                                <div className="bg-surface border border-border rounded-[2px] px-4 py-2 flex items-center gap-2 shadow-none">
                                    <Filter className="w-4 h-4 text-text-muted"/>
                                    <select 
                                        value={selectedProgramId || ''} 
                                        onChange={e => {
                                            const progId = Number(e.target.value);
                                            setSelectedProgramId(progId);
                                            const prog = programsList.find(p => p.programid === progId);
                                            if (prog && prog.section && prog.section.length > 0) {
                                                setSelectedSectionId(prog.section[0].sectionid);
                                            } else {
                                                setSelectedSectionId(null);
                                            }
                                        }} 
                                        className="bg-transparent text-sm font-bold text-primary outline-none"
                                    >
                                        <option value="" disabled>{isLoadingPrograms ? 'Loading programs...' : 'Select Program...'}</option>
                                        {programsList.map(p => (
                                            <option key={p.programid} value={p.programid}>
                                                Program: {p.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="bg-surface border border-border rounded-[2px] px-4 py-2 flex items-center gap-2 shadow-none">
                                    <Filter className="w-4 h-4 text-text-muted"/>
                                    <select 
                                        value={selectedSectionId || ''} 
                                        onChange={e => setSelectedSectionId(e.target.value ? Number(e.target.value) : null)} 
                                        className="bg-transparent text-sm font-bold text-primary outline-none"
                                        disabled={!selectedProgramId}
                                    >
                                        <option value="" disabled>Select Section...</option>
                                        {selectedProgramId && programsList.find(p => p.programid === selectedProgramId)?.section?.map(s => (
                                            <option key={s.sectionid} value={s.sectionid}>
                                                Section: {s.name}
                                            </option>
                                        ))}
                                        {selectedProgramId && (!programsList.find(p => p.programid === selectedProgramId)?.section || programsList.find(p => p.programid === selectedProgramId)?.section.length === 0) && (
                                            <option value="">No Sections Available</option>
                                        )}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Interactive Grid */}
                        <div id="printable-grid" className="bg-surface rounded-[2.5rem] shadow-none border border-border overflow-hidden overflow-x-auto">
                            {isLoadingSlots || isLoadingPrograms ? (
                                <div className="flex items-center justify-center py-24 text-text-secondary font-medium">
                                    Loading visual slots grid...
                                </div>
                            ) : !selectedSectionId ? (
                                <div className="flex flex-col items-center justify-center py-24 text-text-secondary font-medium gap-2">
                                    <AlertTriangle className="w-8 h-8 text-amber-500 " />
                                    <span>Please select a program and section above to view/edit the timetable workspace.</span>
                                </div>
                            ) : (
                                <table className="w-full text-left text-sm table-fixed min-w-[800px]">
                                    <thead className="bg-surface-hover border-b border-border text-text-secondary text-[10px] uppercase tracking-widest font-semibold">
                                        <tr>
                                            <th className="p-4 w-32 border-r border-border text-center bg-background">Time / Day</th>
                                            {days.map(day => <th key={day} className="p-4 text-center border-r border-border">{day}</th>)}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {timeSlots.map((time, idx) => (
                                            <tr key={time} className="border-b border-slate-50 group">
                                                <td className="p-4 border-r border-border bg-surface-hover text-center font-bold text-text-secondary text-xs">
                                                    {time}
                                                </td>
                                                {days.map(day => {
                                                    const slot = gridData[day]?.[time];
                                                    return (
                                                        <td key={`${day}-${time}`} className="p-2 border-r border-slate-50 relative h-28 align-top hover:bg-surface-hover transition-colors">
                                                            {slot ? (
                                                                <div className={`h-full p-3 rounded-[2px] border-2 bg-surface border-border shadow-none hover:border-indigo-300 transition-all`}>
                                                                    <div className="flex justify-between items-start mb-1">
                                                                        <span className="font-semibold text-text-primary text-xs truncate max-w-[80%]">{slot.course}</span>
                                                                        <div className="flex gap-1">
                                                                            <button 
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setEditingSlotId(slot.id);
                                                                                    setSelectedDay(day);
                                                                                    setSelectedTime(time);
                                                                                    const fullSlot = slotsList.find(s => s.slotId === slot.id);
                                                                                    if (fullSlot) {
                                                                                        setFormRoomId(String(roomsList.find(r => r.name === fullSlot.room)?.roomid || ''));
                                                                                        setFormOfferingId(String(fullSlot.offeringId));
                                                                                    }
                                                                                    setIsAddSlotModalOpen(true);
                                                                                }} 
                                                                                className="text-text-muted hover:text-indigo-500 transition-colors shrink-0 no-print"
                                                                            >
                                                                                <Edit2 className="w-3.5 h-3.5" />
                                                                            </button>
                                                                            <button 
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    openConfirm(
                                                                                        'Remove Timetable Slot',
                                                                                        `Are you sure you want to remove the scheduled slot for "${slot.course}"? This cannot be undone.`,
                                                                                        () => {
                                                                                            deleteSlotMutation.mutate(slot.id);
                                                                                            closeConfirm();
                                                                                        }
                                                                                    );
                                                                                }} 
                                                                                disabled={deleteSlotMutation.isPending}
                                                                                className="text-text-muted hover:text-rose-500 transition-colors shrink-0 no-print"
                                                                            >
                                                                                <Trash2 className="w-3.5 h-3.5" />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                    <p className="text-[10px] font-bold text-text-secondary truncate">{slot.teacher}</p>
                                                                    <p className="text-[10px] font-semibold uppercase tracking-widest text-primary bg-primary-light px-1 py-0.5 rounded w-fit mt-2">{slot.room}</p>
                                                                </div>
                                                            ) : (
                                                                    <div 
                                                                        onClick={() => {
                                                                            setEditingSlotId(null);
                                                                            setSelectedDay(day);
                                                                            setSelectedTime(time);
                                                                            if (roomsList.length > 0) {
                                                                                setFormRoomId(String(roomsList[0].roomid));
                                                                            }
                                                                            if (offeringsList.length > 0) {
                                                                                setFormOfferingId(String(offeringsList[0].offeringId));
                                                                            } else {
                                                                                setFormOfferingId('');
                                                                            }
                                                                            setIsAddSlotModalOpen(true);
                                                                        }} 
                                                                        className="w-full h-full border-2 border-dashed border-transparent hover:border-border rounded-[2px] flex items-center justify-center text-text-muted opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[10px] font-bold no-print"
                                                                    >
                                                                    <PlusCircle className="w-4 h-4 mb-1 mr-1"/> Add Slot
                                                                </div>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}

                {/* TAB: VENUES */}
                {activeTab === 'venues' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4">
                        <div onClick={() => setIsAddVenueModalOpen(true)} className="border-2 border-dashed border-border rounded-[2px] p-8 flex flex-col items-center justify-center text-text-muted hover:bg-surface-hover hover:border-indigo-200 transition-colors cursor-pointer group min-h-[220px]">
                            <PlusCircle className="w-12 h-12 mb-4 group-hover:text-indigo-500 transition-colors" />
                            <span className="font-bold">Register Venue</span>
                        </div>
                        {isLoadingRooms ? (
                            <div className="col-span-3 flex items-center justify-center py-12 text-text-secondary font-medium">
                                Loading venues list...
                            </div>
                        ) : roomsList.map(venue => (
                            <div key={venue.roomid} className="bg-surface border border-warning-text text-warning-text hover:bg-warning-bg hover:text-warning-text transition-colors">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <MapPin className="w-16 h-16"/>
                                </div>
                                <div className="flex justify-between items-start mb-6 relative">
                                    <span className={`text-[10px] uppercase font-semibold tracking-widest px-2 py-1 rounded-[2px] ${venue.isactive ? 'bg-background text-success-text' : 'bg-warning-bg text-warning-text'}`}>
                                        {venue.isactive ? 'Active' : 'Archived'}
                                    </span>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openConfirm(
                                                'Archive Venue',
                                                `Are you sure you want to archive "${venue.name}"? It will no longer appear in scheduling options.`,
                                                () => {
                                                    deleteRoomMutation.mutate(venue.roomid);
                                                    closeConfirm();
                                                }
                                            );
                                        }}
                                        disabled={deleteRoomMutation.isPending}
                                        className="text-text-muted hover:text-rose-500 transition-colors no-print"
                                        title="Archive Venue"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                                <h3 className="font-bold text-xl text-text-primary mb-1 relative truncate">{venue.name}</h3>
                                <p className="text-sm text-text-secondary font-medium mb-4 relative">{venue.code} {venue.building ? `(${venue.building})` : ''}</p>
                                
                                <div className="bg-surface-hover border border-border rounded-[2px] p-3 flex justify-between items-center relative">
                                    <span className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">Max Capacity</span>
                                    <span className="font-bold text-text-primary flex items-center gap-1">{venue.capacity} <span className="text-xs text-text-secondary font-medium">Seats</span></span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* TAB: VERSIONS */}
                {activeTab === 'versions' && (
                    <div className="bg-surface rounded-[2.5rem] shadow-none border border-border overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                        <div className="p-6 border-b border-border bg-surface-hover/50 flex flex-col lg:flex-row gap-4 items-center justify-between">
                            <h2 className="text-xl font-bold text-text-primary">Historical Timetable Registry</h2>
                        </div>
                        <div className="p-6">
                            {isLoadingVersions ? (
                                <div className="flex items-center justify-center py-12 text-text-secondary font-medium">
                                    Loading timetable versions...
                                </div>
                            ) : (
                                <ul className="space-y-4">
                                    {versionsList.map(v => (
                                        <li key={v.timetableid} className="flex flex-col md:flex-row justify-between items-start md:items-center p-5 border border-border rounded-[2px] hover:bg-surface-hover hover:border-border transition-colors">
                                            <div className="flex items-center gap-4 mb-4 md:mb-0">
                                                <div className={`p-3 rounded-[2px] shadow-none ${v.status === 'PUBLISHED' ? 'bg-background text-success-text' : 'bg-background text-text-secondary'}`}>
                                                    {v.status === 'PUBLISHED' ? <CheckCircle2 className="w-6 h-6"/> : <Archive className="w-6 h-6"/>}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-text-primary">{v.name} <span className="text-sm text-text-muted font-normal">({v.timetableid})</span></h4>
                                                    <p className="text-xs font-semibold text-text-secondary mt-1">Saved on {new Date(v.createdat).toLocaleString()} by {currentUser?.fullName || 'Admin'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 w-full md:w-auto">
                                                <AdminStatusBadge status={v.status} variant={v.status === 'PUBLISHED' ? 'success' : 'default'} />
                                                <button onClick={() => alert(`Opening version matrix for ${v.name}`)} className="text-primary bg-primary-light p-2 rounded-[2px] hover:bg-indigo-100 transition-colors ml-auto md:ml-0" title="View Version Matrix">
                                                    <Eye className="w-5 h-5"/>
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                    {versionsList.length === 0 && (
                                        <div className="text-center py-8 text-text-muted font-medium">
                                            No historical versions found.
                                        </div>
                                    )}
                                </ul>
                            )}
                        </div>
                    </div>
                )}
            </AdminPageWrapper>

            {/* MODAL: Add Slot */}
            <Modal isOpen={isAddSlotModalOpen} onClose={() => { setIsAddSlotModalOpen(false); setEditingSlotId(null); }} title={editingSlotId ? "Edit Timetable Slot" : "Schedule New Course Slot"}>
                <form className="space-y-4" onSubmit={handleAddSlotSubmit}>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-1">Target Day</label>
                            <select value={selectedDay} onChange={e => setSelectedDay(e.target.value)} className="w-full bg-surface-hover border border-border rounded-[2px] px-4 py-3 outline-none focus:border-indigo-500 font-medium bg-surface">
                                {days.map(d => <option key={d}>{d}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-1">Time Slot</label>
                            <select value={selectedTime} onChange={e => setSelectedTime(e.target.value)} className="w-full bg-surface-hover border border-border rounded-[2px] px-4 py-3 outline-none focus:border-indigo-500 font-medium bg-surface">
                                {timeSlots.map(t => <option key={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-1">Assign Course Offering</label>
                        <select 
                            value={formOfferingId} 
                            onChange={e => setFormOfferingId(e.target.value)} 
                            className="w-full bg-surface-hover border border-border rounded-[2px] px-4 py-3 outline-none focus:border-indigo-500 font-medium bg-surface"
                            required
                        >
                            <option value="" disabled>{isLoadingOfferings ? 'Loading course offerings...' : 'Select course offering...'}</option>
                            {offeringsList.map(o => (
                                <option key={o.offeringId} value={o.offeringId}>{o.name} - {o.teacher}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-1">Assigned Venue</label>
                        <select required value={formRoomId} onChange={e => setFormRoomId(e.target.value)} className="w-full bg-surface-hover border border-border rounded-[2px] px-4 py-3 outline-none focus:border-indigo-500 font-medium bg-surface">
                            <option value="" disabled>Select physical room...</option>
                            {roomsList.map(v => (
                                <option key={v.roomid} value={v.roomid}>{v.name} ({v.code})</option>
                            ))}
                        </select>
                    </div>
                    <button type="submit" disabled={createSlotMutation.isPending || updateSlotMutation.isPending || !formRoomId} className="w-full mt-4 bg-primary text-white font-semibold py-4 rounded-[2px] hover:bg-primary-hover transition-colors shadow-none shadow-indigo-200">
                        {editingSlotId ? (updateSlotMutation.isPending ? 'Updating...' : 'Update Timetable Slot') : (createSlotMutation.isPending ? 'Mapping Slot...' : 'Map Slot to Timetable')}
                    </button>
                </form>
            </Modal>

            {/* MODAL: Register Venue */}
            <Modal isOpen={isAddVenueModalOpen} onClose={() => setIsAddVenueModalOpen(false)} title="Register Physical Asset / Venue">
                <form className="space-y-4" onSubmit={handleAddVenueSubmit}>
                    <div>
                        <label className="block text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-1">Venue Name / Room Number</label>
                        <input type="text" required value={venueName} onChange={e => setVenueName(e.target.value)} placeholder="e.g. Lab 4 (Floor 3)" className="w-full bg-surface-hover border border-border rounded-[2px] px-4 py-3 outline-none focus:border-indigo-500 font-medium" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-1">Room Code</label>
                            <input type="text" required value={venueCode} onChange={e => setVenueCode(e.target.value)} placeholder="e.g. LAB-4" className="w-full bg-surface-hover border border-border rounded-[2px] px-4 py-3 outline-none focus:border-indigo-500 font-medium" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-1">Capacity</label>
                            <input type="number" required value={venueCapacity} onChange={e => setVenueCapacity(e.target.value)} placeholder="50" className="w-full bg-surface-hover border border-border rounded-[2px] px-4 py-3 outline-none focus:border-indigo-500 font-medium" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-1">Building Location</label>
                        <input type="text" value={venueBuilding} onChange={e => setVenueBuilding(e.target.value)} placeholder="e.g. Science Block" className="w-full bg-surface-hover border border-border rounded-[2px] px-4 py-3 outline-none focus:border-indigo-500 font-medium" />
                    </div>
                    <button type="submit" disabled={createRoomMutation.isPending} className="w-full mt-4 bg-primary text-white font-semibold py-4 rounded-[2px] hover:bg-primary-hover transition-colors shadow-none shadow-indigo-200 text-sm">
                        {createRoomMutation.isPending ? 'Registering Venue...' : 'Confirm Asset Registration'}
                    </button>
                </form>
            </Modal>

            {/* CONFIRM DELETE MODAL */}
            <ConfirmModal
                isOpen={confirmModal.open}
                onClose={closeConfirm}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                isPending={deleteSlotMutation.isPending || deleteRoomMutation.isPending || publishTimetableMutation.isPending}
            />
        </DashboardLayout>
    );
}

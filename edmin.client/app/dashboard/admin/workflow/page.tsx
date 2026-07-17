'use client';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Activity, RefreshCw, AlertTriangle, CheckCircle2, Clock, Loader2, Play, 
  ChevronRight, X, Search, Filter, Eye, RotateCcw, FileText, CreditCard, 
  GraduationCap, Inbox, Layers, Settings, Terminal, ArrowRight, Database, 
  Workflow, User, Plus, Check, HelpCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import DashboardLayout from '@/components/DashboardLayout';
import { UserRole } from '@/types/types';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { 
  fetchWorkflowEvents, 
  replayWorkflowEvent, 
  forceRetryWorkflowEvent, 
  resolveWorkflowEvent, 
  injectWorkflowEvent,
  WorkflowEvent 
} from '@/api/workflow';

// Event configuration with color theme, icons, and human-readable names
const EVENT_CONFIG: Record<string, { label: string; icon: any; color: string; border: string; bg: string; text: string }> = {
  STUDENT_ENROLLED:   { label: 'Student Enrolled',   icon: User,          color: 'from-blue-500 to-indigo-600', border: 'border-blue-200',   bg: 'bg-primary-light',   text: 'text-primary' },
  INVOICE_GENERATED:  { label: 'Invoice Generated',  icon: FileText,      color: 'from-amber-500 to-orange-600', border: 'border-amber-200',  bg: 'bg-warning-bg',  text: 'text-warning-text' },
  PAYMENT_RECEIVED:   { label: 'Payment Received',   icon: CreditCard,    color: 'from-emerald-500 to-teal-600', border: 'border-emerald-200',bg: 'bg-background',text: 'text-success-text' },
  GRADES_PUBLISHED:   { label: 'Grades Published',   icon: GraduationCap,  color: 'from-purple-500 to-pink-600', border: 'border-purple-200', bg: 'bg-background', text: 'text-purple-700' },
  COURSE_COMPLETED:   { label: 'Course Completed',   icon: Layers,        color: 'from-indigo-500 to-violet-600', border: 'border-indigo-200', bg: 'bg-primary-light', text: 'text-primary' },
  TICKET_CREATED:     { label: 'Ticket Created',     icon: Activity,      color: 'from-cyan-500 to-blue-600', border: 'border-cyan-200',   bg: 'bg-cyan-50',   text: 'text-cyan-700' },
  TICKET_RESOLVED:    { label: 'Ticket Resolved',    icon: CheckCircle2,  color: 'from-[#DFF6DD]0 to-emerald-600', border: 'border-green-200', bg: 'bg-success-bg',  text: 'text-green-700' },
  TICKET_MESSAGE_ADDED: { label: 'Ticket Msg Added', icon: Activity,      color: 'from-slate-500 to-slate-700', border: 'border-border', bg: 'bg-surface-hover',  text: 'text-text-primary' },
};

const STATUS_CONFIG = {
  PENDING:    { label: 'Pending',    color: 'bg-background text-text-primary border-border',  dot: 'bg-slate-400',  icon: Clock,       text: 'text-text-secondary' },
  PROCESSING: { label: 'Processing', color: 'bg-primary-light text-blue-800 border-blue-200',     dot: 'bg-primary-light0',   icon: Loader2,     text: 'text-blue-500' },
  COMPLETED:  { label: 'Completed',  color: 'bg-background text-emerald-800 border-emerald-200', dot: 'bg-background0', icon: CheckCircle2, text: 'text-emerald-500' },
  FAILED:     { label: 'Failed',     color: 'bg-error-bg text-rose-800 border-rose-200',        dot: 'bg-error-bg0',    icon: AlertTriangle, text: 'text-rose-500' },
} as const;

function StatusBadge({ status }: { status: keyof typeof STATUS_CONFIG }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] text-xs font-semibold border ${cfg.color}`}>
      {status === 'PROCESSING'
        ? <Icon className="h-3 w-3 animate-spin" strokeWidth={2.5} />
        : <Icon className="h-3 w-3" strokeWidth={2.5} />}
      {cfg.label}
    </span>
  );
}

export default function WorkflowDashboard() {
    const { data: currentUser } = useCurrentUser();
  const [events, setEvents] = useState<WorkflowEvent[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 40, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<WorkflowEvent | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Gmail-style category filters
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'FINANCE' | 'ACADEMIC' | 'SYSTEM' | 'FAILED'>('ALL');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'PRIORITY' | 'DATE_DESC' | 'DATE_ASC'>('PRIORITY');
  
  // Inspector Tabs
  const [inspectorTab, setInspectorTab] = useState<'OVERVIEW' | 'PAYLOAD' | 'LOGS' | 'GRAPH'>('OVERVIEW');

  // Inject Custom Event Modal state
  const [showInjectModal, setShowInjectModal] = useState(false);
  const [injectForm, setInjectForm] = useState({
    event_type: 'STUDENT_ENROLLED',
    aggregate_type: 'student',
    aggregate_id: 101,
    payloadStr: '{\n  "studentId": 101,\n  "semesterId": 3,\n  "enrolledCredits": 15\n}'
  });

  // Entity Lifecycle View state
  const [showLifecycleExplorer, setShowLifecycleExplorer] = useState(false);
  const [lifecycleSearchId, setLifecycleSearchId] = useState('101');
  const [lifecycleEvents, setLifecycleEvents] = useState<WorkflowEvent[]>([]);
  const [searchingLifecycle, setSearchingLifecycle] = useState(false);

  // Fetch workflow events list
  const loadEvents = useCallback(async (page = 1) => {
    try {
      const res = await fetchWorkflowEvents({
        page,
        limit: 40
      });
      setEvents(res.events);
      setPagination(res.pagination);
      setLastUpdated(new Date());

      // Update selected event details in-place if open
      if (selectedEvent) {
        const fresh = res.events.find(e => e.id === selectedEvent.id);
        if (fresh) setSelectedEvent(fresh);
      }
    } catch (e: any) {
      console.error('Failed to load workflow events', e);
      toast.error('Failed to fetch events from control plane');
    } finally {
      setLoading(false);
    }
  }, [selectedEvent?.id]);

  // Initial load + 5s polling
  useEffect(() => {
    loadEvents(1);
    const interval = setInterval(() => {
      loadEvents(pagination.page);
    }, 5000);
    return () => clearInterval(interval);
  }, [pagination.page]);

  // Category event type filtering
  const filteredEvents = useMemo(() => {
    let result = [...events];

    // Filter by Mailbox Category
    if (activeCategory === 'FAILED') {
      result = result.filter(e => e.status === 'FAILED');
    } else if (activeCategory === 'FINANCE') {
      result = result.filter(e => ['INVOICE_GENERATED', 'PAYMENT_RECEIVED'].includes(e.event_type));
    } else if (activeCategory === 'ACADEMIC') {
      result = result.filter(e => ['STUDENT_ENROLLED', 'COURSE_COMPLETED', 'GRADES_PUBLISHED'].includes(e.event_type));
    } else if (activeCategory === 'SYSTEM') {
      result = result.filter(e => ['TICKET_CREATED', 'TICKET_RESOLVED', 'TICKET_MESSAGE_ADDED'].includes(e.event_type));
    }

    // Filter by search keyword
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(e => 
        e.event_type.toLowerCase().includes(q) ||
        e.aggregate_type.toLowerCase().includes(q) ||
        String(e.aggregate_id).includes(q) ||
        (e.last_error && e.last_error.toLowerCase().includes(q))
      );
    }

    // Gmail Priority Sorting: Failed 🔴 -> Pending 🟡 -> Processing 🔵 -> Completed 🟢
    if (sortBy === 'PRIORITY') {
      const priorityMap: Record<string, number> = { FAILED: 0, PENDING: 1, PROCESSING: 2, COMPLETED: 3 };
      result.sort((a, b) => {
        const pA = priorityMap[a.status] ?? 4;
        const pB = priorityMap[b.status] ?? 4;
        if (pA !== pB) return pA - pB;
        // Fallback to date desc
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    } else if (sortBy === 'DATE_DESC') {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortBy === 'DATE_ASC') {
      result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }

    return result;
  }, [events, activeCategory, search, sortBy]);

  // Count helper for category badges
  const categoryCounts = useMemo(() => {
    return {
      ALL: events.length,
      FINANCE: events.filter(e => ['INVOICE_GENERATED', 'PAYMENT_RECEIVED'].includes(e.event_type)).length,
      ACADEMIC: events.filter(e => ['STUDENT_ENROLLED', 'COURSE_COMPLETED', 'GRADES_PUBLISHED'].includes(e.event_type)).length,
      SYSTEM: events.filter(e => ['TICKET_CREATED', 'TICKET_RESOLVED', 'TICKET_MESSAGE_ADDED'].includes(e.event_type)).length,
      FAILED: events.filter(e => e.status === 'FAILED').length,
    };
  }, [events]);

  // Execute Replay action
  const handleReplay = async (id: number) => {
    setActionLoading(`replay-${id}`);
    try {
      await replayWorkflowEvent(id);
      toast.success(`Event #${id} successfully replayed! Status reset to PENDING.`);
      loadEvents(pagination.page);
    } catch (e: any) {
      toast.error(e.message || 'Failed to replay event');
    } finally {
      setActionLoading(null);
    }
  };

  // Execute Force Retry action
  const handleForceRetry = async (id: number) => {
    setActionLoading(`force-${id}`);
    try {
      await forceRetryWorkflowEvent(id);
      toast.success(`Forced retry triggered for event #${id}!`);
      loadEvents(pagination.page);
    } catch (e: any) {
      toast.error(e.message || 'Failed to force retry event');
    } finally {
      setActionLoading(null);
    }
  };

  // Execute Mark Resolved action
  const handleResolve = async (id: number) => {
    setActionLoading(`resolve-${id}`);
    try {
      await resolveWorkflowEvent(id);
      toast.success(`Event #${id} marked as COMPLETED.`);
      loadEvents(pagination.page);
    } catch (e: any) {
      toast.error(e.message || 'Failed to resolve event');
    } finally {
      setActionLoading(null);
    }
  };

  // Inject manual event execution
  const handleInjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsedPayload = JSON.parse(injectForm.payloadStr);
      await injectWorkflowEvent({
        event_type: injectForm.event_type,
        aggregate_type: injectForm.aggregate_type,
        aggregate_id: Number(injectForm.aggregate_id),
        payload: parsedPayload
      });
      toast.success('Manual event injected successfully into outbox!');
      setShowInjectModal(false);
      loadEvents(1);
    } catch (err: any) {
      toast.error('Invalid JSON payload or API injection failure.');
    }
  };

  // Quick Simulation Template triggers
  const triggerSimulation = async (scenario: string) => {
    let mockEvent = {
      event_type: 'STUDENT_ENROLLED',
      aggregate_type: 'student',
      aggregate_id: Math.floor(Math.random() * 1000) + 1000,
      payload: {}
    };

    if (scenario === 'ENROLL_FAIL') {
      mockEvent = {
        event_type: 'STUDENT_ENROLLED',
        aggregate_type: 'student',
        aggregate_id: Math.floor(Math.random() * 1000) + 1000,
        payload: { studentId: 9999, semesterId: 1, enrolledCredits: 22, forceInvoiceFailure: true } // studentId 9999 triggers mock db failure
      };
      toast.loading('Simulating student enrollment failure...', { duration: 2000 });
    } else if (scenario === 'PAYMENT_OK') {
      const payId = Math.floor(Math.random() * 9000) + 1000;
      mockEvent = {
        event_type: 'PAYMENT_RECEIVED',
        aggregate_type: 'invoice',
        aggregate_id: Math.floor(Math.random() * 500) + 100,
        payload: { paymentId: payId, invoiceId: Math.floor(Math.random() * 500) + 100, studentId: Math.floor(Math.random() * 200) + 1, amount: 2500 }
      };
      toast.loading('Simulating payment receipt...', { duration: 2000 });
    } else if (scenario === 'GRADES_OK') {
      mockEvent = {
        event_type: 'GRADES_PUBLISHED',
        aggregate_type: 'assessment',
        aggregate_id: Math.floor(Math.random() * 300) + 50,
        payload: { examSessionId: 44, studentId: 12, courseName: 'Advanced Enterprise Architectures' }
      };
      toast.loading('Simulating grades publication workflow...', { duration: 2000 });
    }

    try {
      await injectWorkflowEvent(mockEvent);
      setTimeout(() => {
        loadEvents(1);
        toast.success('Simulation event injected! Watch the stream update.');
      }, 1000);
    } catch (e: any) {
      toast.error('Simulation injection failed.');
    }
  };

  // Search entity lifecycle history
  const handleLifecycleSearch = async () => {
    setSearchingLifecycle(true);
    try {
      const searchId = Number(lifecycleSearchId);
      // Fetch a larger set of events to filter through
      const res = await fetchWorkflowEvents({ page: 1, limit: 100 });
      
      // Filter events matching the student/invoice ID in payload or aggregate
      const matching = res.events.filter(e => {
        const payload = e.payload || {};
        return (
          e.aggregate_id === searchId ||
          payload.studentId === searchId ||
          payload.invoiceId === searchId ||
          payload.student_id === searchId
        );
      });
      setLifecycleEvents(matching);
      toast.success(`Found ${matching.length} lifecycle events for ID ${searchId}`);
    } catch (e) {
      toast.error('Failed to query lifecycle events');
    } finally {
      setSearchingLifecycle(false);
    }
  };

  // Generate Simulated logs for Worker terminal
  const simulatedConsoleLogs = useMemo(() => {
    if (!selectedEvent) return [];
    const timestampStr = new Date(selectedEvent.created_at).toLocaleTimeString();
    const eventTime = new Date(selectedEvent.created_at).getTime();
    const procTime = selectedEvent.processed_at ? new Date(selectedEvent.processed_at).toLocaleTimeString() : new Date(eventTime + 1200).toLocaleTimeString();

    const baseLogs = [
      `[${timestampStr}] [INFO] Outbox Event #${selectedEvent.id} created in DB queue.`,
      `[${timestampStr}] [INFO] Poller instance lock:outboxPoller acquired successfully.`,
      `[${timestampStr}] [INFO] Launching worker handler execution for: ${selectedEvent.event_type}...`
    ];

    if (selectedEvent.status === 'COMPLETED') {
      return [
        ...baseLogs,
        `[${procTime}] [INFO] Dispatching payload payload to domain service...`,
        `[${procTime}] [INFO] Handler process duration: 234ms. Database lock released.`,
        `[${procTime}] [SUCCESS] Event #${selectedEvent.id} completed successfully. Status set to COMPLETED.`
      ];
    } else if (selectedEvent.status === 'FAILED') {
      return [
        ...baseLogs,
        `[${procTime}] [ERROR] Process failed during transaction propagation.`,
        `[${procTime}] [ERROR] Exception message: "${selectedEvent.last_error || 'Internal error'}"`,
        `[${procTime}] [WARNING] Retry threshold count: ${selectedEvent.attempt_count}/5.`,
        `[${procTime}] [FATAL] Retry limit reached or failed. Moved event #${selectedEvent.id} to Dead Letter Queue (DLQ).`
      ];
    } else if (selectedEvent.status === 'PROCESSING') {
      return [
        ...baseLogs,
        `[${timestampStr}] [INFO] Lock status: ACTIVE. Running database updates...`,
        `[${timestampStr}] [INFO] Event status transitioned to PROCESSING.`
      ];
    } else {
      return [
        `[${timestampStr}] [INFO] Outbox Event #${selectedEvent.id} initialized.`,
        `[${timestampStr}] [INFO] State is PENDING. Waiting for poller cycle (next run in 5s)...`
      ];
    }
  }, [selectedEvent]);

  // Quick Preset Helper for Injection modal payloads
  const setInjectPreset = (type: string) => {
    let preset = { event_type: type, aggregate_type: 'student', aggregate_id: 101, payloadStr: '' };
    if (type === 'STUDENT_ENROLLED') {
      preset.payloadStr = '{\n  "studentId": 101,\n  "semesterId": 3,\n  "enrolledCredits": 15\n}';
    } else if (type === 'INVOICE_GENERATED') {
      preset.aggregate_type = 'invoice';
      preset.payloadStr = '{\n  "invoiceId": 501,\n  "studentId": 101,\n  "totalAmount": 2400,\n  "dueDate": "2026-09-01T00:00:00.000Z"\n}';
    } else if (type === 'PAYMENT_RECEIVED') {
      preset.aggregate_type = 'invoice';
      preset.payloadStr = '{\n  "paymentId": 901,\n  "invoiceId": 501,\n  "studentId": 101,\n  "amount": 2400\n}';
    } else if (type === 'GRADES_PUBLISHED') {
      preset.aggregate_type = 'assessment';
      preset.payloadStr = '{\n  "examSessionId": 45,\n  "studentId": 101,\n  "courseName": "Introduction to Databases"\n}';
    } else if (type === 'COURSE_COMPLETED') {
      preset.payloadStr = '{\n  "studentId": 101,\n  "courseId": 204\n}';
    }
    setInjectForm(preset);
  };

  return (
    <DashboardLayout userName={currentUser?.fullName || 'Admin'} userRole={UserRole.ADMIN} notifications={[]} currentPath="/dashboard/admin/workflow">
      <div className="flex h-[calc(100vh-120px)] bg-slate-900 text-slate-100 overflow-hidden font-sans">
      
      {/* ─── Pane 1: Gmail-style Category Navigation & Toolbox ─── */}
      <div className="w-64 border-r border-slate-800 bg-slate-950 flex flex-col justify-between p-4">
        <div className="space-y-6">
          <div className="flex items-center gap-2.5 px-2">
            <div className="h-9 w-9 rounded-[2px] bg-primary flex items-center justify-center shadow-none shadow-indigo-500/20">
              <Workflow className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold  bg-gradient-to-r from-indigo-200 to-slate-200 bg-clip-text text-transparent">Control Plane</h1>
              <p className="text-[10px] text-text-secondary font-mono">v1.2 // Live Monitor</p>
            </div>
          </div>

          {/* Action trigger button */}
          {process.env.NEXT_PUBLIC_ENABLE_SIMULATOR === 'true' && (
            <button 
              onClick={() => setShowInjectModal(true)}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold py-2.5 rounded-[2px] transition-all hover:shadow-none hover:shadow-indigo-500/10 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Inject Manual Event
            </button>
          )}

          {/* Mailbox Navigation Categories */}
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-text-secondary px-2 uppercase tracking-wider mb-2">Event Queue Categories</p>
            
            {[
              { id: 'ALL', label: 'All Mailbox', icon: Inbox, color: 'text-indigo-400' },
              { id: 'FAILED', label: 'Failed DLQ', icon: AlertTriangle, color: 'text-rose-500' },
              { id: 'ACADEMIC', label: 'Academic Events', icon: GraduationCap, color: 'text-purple-400' },
              { id: 'FINANCE', label: 'Finance Events', icon: FileText, color: 'text-amber-500' },
              { id: 'SYSTEM', label: 'System Tickets', icon: Activity, color: 'text-cyan-400' },
            ].map(cat => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id && !showLifecycleExplorer;
              const count = categoryCounts[cat.id as keyof typeof categoryCounts];
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id as any);
                    setShowLifecycleExplorer(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-[2px] text-xs font-medium transition-all group ${
                    isActive 
                      ? 'bg-primary text-white' 
                      : 'text-text-muted hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${isActive ? 'text-white' : cat.color}`} />
                    <span>{cat.label}</span>
                  </div>
                  {count > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-[2px] text-[10px] font-bold ${
                      isActive ? 'bg-indigo-800 text-white' : 'bg-slate-800 text-text-muted group-hover:bg-slate-700'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Specialized Tools section */}
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-text-secondary px-2 uppercase tracking-wider mb-2">Enterprise Cockpit</p>
            <button
              onClick={() => {
                setShowLifecycleExplorer(true);
                handleLifecycleSearch();
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-[2px] text-xs font-medium transition-all ${
                showLifecycleExplorer
                  ? 'bg-violet-600 text-white'
                  : 'text-text-muted hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <Layers className="h-4 w-4 text-violet-400" />
              <span>Entity Lifecycle View</span>
            </button>
          </div>
        </div>

        {/* Simulation preset engine panel */}
        {process.env.NEXT_PUBLIC_ENABLE_SIMULATOR === 'true' && (
          <div className="bg-slate-900/60 rounded-[2px] p-3 border border-slate-800 space-y-2">
            <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Simulate Workflows</p>
            <div className="space-y-1.5">
              <button
                onClick={() => triggerSimulation('PAYMENT_OK')}
                className="w-full flex items-center justify-between text-left text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1.5 rounded-[2px] border border-slate-700 transition-colors"
              >
                <span>Simulate Payment Received</span>
                <Play className="h-3 w-3 text-emerald-400" />
              </button>
              <button
                onClick={() => triggerSimulation('GRADES_OK')}
                className="w-full flex items-center justify-between text-left text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1.5 rounded-[2px] border border-slate-700 transition-colors"
              >
                <span>Simulate Grade Published</span>
                <Play className="h-3 w-3 text-purple-400" />
              </button>
              <button
                onClick={() => triggerSimulation('ENROLL_FAIL')}
                className="w-full flex items-center justify-between text-left text-[11px] bg-rose-950/20 hover:bg-rose-950/40 text-rose-300 px-2.5 py-1.5 rounded-[2px] border border-rose-900/40 transition-colors"
              >
                <span>Simulate Enrollment Failure</span>
                <Play className="h-3 w-3 text-rose-400" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Pane 2: Central Content Area (Event Stream OR Lifecycle Explorer) ─── */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-900">
        
        {/* Top Header Panel */}
        <div className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-200">
              {showLifecycleExplorer ? 'Entity Lifecycle Explorer' : `Event Queue Stream (${filteredEvents.length})`}
            </span>
            <div className="flex items-center gap-1.5 text-[10px] text-text-secondary font-mono">
              <span className="h-1.5 w-1.5 rounded-[2px] bg-background0 "></span>
              {lastUpdated ? `Sync: ${lastUpdated.toLocaleTimeString()}` : 'Connecting...'}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {!showLifecycleExplorer && (
              <>
                <div className="relative w-64">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-secondary" />
                  <input
                    type="text"
                    placeholder="Search by event, aggregate ID..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-850 pl-8 pr-3 py-1.5 rounded-[2px] text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as any)}
                  className="bg-slate-900 border border-slate-850 text-xs px-2.5 py-1.5 rounded-[2px] focus:outline-none text-slate-300"
                >
                  <option value="PRIORITY">Priority Sorting (Failed 🔴 first)</option>
                  <option value="DATE_DESC">Date (Newest first)</option>
                  <option value="DATE_ASC">Date (Oldest first)</option>
                </select>
              </>
            )}

            <button 
              onClick={() => {
                setLoading(true);
                loadEvents(pagination.page);
                if (showLifecycleExplorer) handleLifecycleSearch();
              }}
              className="p-1.5 rounded-[2px] bg-slate-850 hover:bg-slate-800 text-text-muted hover:text-slate-200 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${loading || searchingLifecycle ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* ─── Mode A: Entity Lifecycle Explorer View ─── */}
        {showLifecycleExplorer ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="bg-slate-950 border border-slate-850 rounded-[2px] p-5 space-y-4">
              <AdminPageWrapper>
                <div className="flex-1 space-y-1.5">
                  <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Search Student Aggregate ID</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
                    <input
                      type="number"
                      value={lifecycleSearchId}
                      onChange={e => setLifecycleSearchId(e.target.value)}
                      placeholder="e.g. 101"
                      className="w-full bg-slate-900 border border-slate-800 pl-9 pr-3 py-2 rounded-[2px] text-sm focus:outline-none focus:border-indigo-500 text-slate-100"
                    />
                  </div>
                </div>
                <button
                  onClick={handleLifecycleSearch}
                  disabled={searchingLifecycle}
                  className="bg-indigo-600 hover:bg-primary-light0 text-white text-xs font-semibold px-5 py-2.5 rounded-[2px] transition-colors cursor-pointer"
                >
                  {searchingLifecycle ? 'Searching...' : 'Explore Lifecycle'}
                </button>
              </AdminPageWrapper>

              <p className="text-xs text-text-muted">
                Queries the workflow events table to construct the full chain of transactions linked to the student (Enrollment, Invoicing, Payments, Grades).
              </p>
            </div>

            {/* Lifecycle Flowchart Pipeline */}
            <div className="bg-slate-950 border border-slate-850 rounded-[2px] p-6">
              <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-6">Student Lifecycle Chain</h3>

              <div className="relative flex flex-col md:flex-row items-center justify-between gap-6 md:gap-4 max-w-4xl mx-auto py-8">
                {/* Horizontal line for desktop */}
                <div className="hidden md:block absolute top-[44px] left-[5%] right-[5%] h-0.5 bg-slate-800 z-0"></div>

                {[
                  { step: 'STUDENT_ENROLLED', label: '1. Enrollment', desc: 'Admission & registration' },
                  { step: 'INVOICE_GENERATED', label: '2. Bill Generation', desc: 'Semester fee allocation' },
                  { step: 'PAYMENT_RECEIVED', label: '3. Payment Received', desc: 'Receipt generation' },
                  { step: 'GRADES_PUBLISHED', label: '4. Exam Grades', desc: 'Grading publication' },
                  { step: 'COURSE_COMPLETED', label: '5. Degree Recalculation', desc: 'Degree audit sync' }
                ].map((item, index) => {
                  const match = lifecycleEvents.find(e => e.event_type === item.step);
                  const isCompleted = match?.status === 'COMPLETED';
                  const isFailed = match?.status === 'FAILED';
                  const isProcessing = match?.status === 'PROCESSING';
                  const isPending = match?.status === 'PENDING';
                  const hasStarted = !!match;

                  let nodeBg = 'bg-slate-900 border-slate-800 text-text-secondary';
                  let nodeRing = 'ring-slate-800';
                  let statusText = 'Not Started';

                  if (isCompleted) {
                    nodeBg = 'bg-background0/10 border-emerald-500 text-emerald-400';
                    nodeRing = 'ring-emerald-500/20';
                    statusText = 'Completed';
                  } else if (isFailed) {
                    nodeBg = 'bg-error-bg0/10 border-rose-500 text-rose-400 ';
                    nodeRing = 'ring-rose-500/30';
                    statusText = 'Failed (DLQ)';
                  } else if (isProcessing) {
                    nodeBg = 'bg-primary-light0/10 border-blue-500 text-blue-400 ';
                    nodeRing = 'ring-blue-500/30';
                    statusText = 'Processing';
                  } else if (isPending) {
                    nodeBg = 'bg-warning-bg0/10 border-amber-500 text-amber-400';
                    nodeRing = 'ring-amber-500/20';
                    statusText = 'Pending Queue';
                  }

                  return (
                    <div key={item.step} className="flex-1 flex flex-col items-center text-center relative z-10 w-full">
                      <button
                        onClick={() => {
                          if (match) setSelectedEvent(match);
                        }}
                        disabled={!match}
                        className={`h-14 w-14 rounded-[2px] border-2 ${nodeBg} flex items-center justify-center ring-4 ${nodeRing} transition-all duration-200 ${
                          match ? 'hover:scale-110 cursor-pointer shadow-none' : 'cursor-not-allowed'
                        }`}
                      >
                        {isCompleted && <Check className="h-6 w-6 text-emerald-400" />}
                        {isFailed && <AlertTriangle className="h-6 w-6 text-rose-400" />}
                        {isProcessing && <Loader2 className="h-6 w-6 text-blue-400 animate-spin" />}
                        {isPending && <Clock className="h-6 w-6 text-amber-400" />}
                        {!hasStarted && <HelpCircle className="h-6 w-6 text-text-primary" />}
                      </button>

                      <div className="mt-3 space-y-1">
                        <p className="text-xs font-bold text-slate-200">{item.label}</p>
                        <p className="text-[10px] text-text-muted px-2">{item.desc}</p>
                        <span className={`inline-block text-[9px] font-bold uppercase tracking-wider mt-1 ${
                          isCompleted ? 'text-emerald-400' :
                          isFailed ? 'text-rose-400' :
                          isProcessing ? 'text-blue-400' :
                          isPending ? 'text-amber-400' : 'text-text-secondary'
                        }`}>
                          {statusText}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Lifecycle Log list */}
            <div className="bg-slate-950 border border-slate-850 rounded-[2px] p-5 space-y-3">
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Associated Transactions Log</p>
              {lifecycleEvents.length === 0 ? (
                <p className="text-xs text-text-secondary">No events populated in pipeline. Try triggering a simulation above.</p>
              ) : (
                <div className="space-y-2">
                  {lifecycleEvents.map(e => (
                    <div 
                      key={e.id}
                      onClick={() => setSelectedEvent(e)}
                      className="flex items-center justify-between p-3 rounded-[2px] bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`h-2 w-2 rounded-[2px] ${STATUS_CONFIG[e.status]?.dot}`} />
                        <div>
                          <p className="text-xs font-bold text-slate-200">{e.event_type}</p>
                          <p className="text-[10px] text-text-secondary font-mono">ID: #{e.id} · Aggregate: {e.aggregate_type} #{e.aggregate_id}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={e.status} />
                        <ChevronRight className="h-4 w-4 text-text-secondary" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          
          // ─── Mode B: Gmail-Style Event Stream ───
          <div className="flex-1 overflow-y-auto p-6">
            {loading && events.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                <span className="text-xs text-text-muted mt-2 font-mono">Polling server queue...</span>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-text-secondary">
                <Inbox className="h-12 w-12 text-text-primary mb-3" />
                <p className="text-sm font-semibold">Workspace is clean</p>
                <p className="text-xs mt-1">No workflow events matching this filter category were found.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredEvents.map(event => {
                  const cfg = EVENT_CONFIG[event.event_type] || { label: event.event_type, icon: HelpCircle, color: 'from-slate-500 to-slate-600', border: 'border-slate-700', bg: 'bg-slate-900', text: 'text-text-muted' };
                  const statusCfg = STATUS_CONFIG[event.status] || STATUS_CONFIG.PENDING;
                  const isSelected = selectedEvent?.id === event.id;
                  const IconComponent = cfg.icon;

                  return (
                    <div
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className={`relative flex items-center justify-between p-3.5 rounded-[2px] border transition-all duration-150 group hover:shadow-none cursor-pointer ${
                        isSelected 
                          ? 'bg-slate-850/80 border-indigo-500 shadow-indigo-500/5 ring-1 ring-indigo-500' 
                          : event.status === 'FAILED'
                            ? 'bg-rose-950/10 border-rose-900/30 hover:border-rose-900/60'
                            : 'bg-slate-950/60 border-slate-850 hover:border-slate-800'
                      }`}
                    >
                      {/* Priority left color band indicator */}
                      <span className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-md ${
                        event.status === 'FAILED' ? 'bg-error-bg0' :
                        event.status === 'PROCESSING' ? 'bg-primary-light0 ' :
                        event.status === 'PENDING' ? 'bg-surface-hover0' : 'bg-background0'
                      }`} />

                      <div className="flex items-center gap-4 pl-2 min-w-0">
                        {/* Event type specific visual icon */}
                        <div className={`h-9 w-9 rounded-[2px] bg-gradient-to-br ${cfg.color} flex items-center justify-center flex-shrink-0 shadow-none`}>
                          <IconComponent className="h-5 w-5 text-white" />
                        </div>

                        {/* Event detail description column */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-200 truncate">
                              {cfg.label}
                            </span>
                            <span className="text-[10px] text-text-secondary font-mono">#{event.id}</span>
                          </div>
                          
                          <div className="flex items-center gap-3 mt-1 text-[11px] text-text-muted">
                            <span className="capitalize">Aggregate: <b className="text-slate-300">{event.aggregate_type}</b> <code className="text-indigo-400 font-mono">#{event.aggregate_id}</code></span>
                            {event.attempt_count > 0 && (
                              <span className={`flex items-center gap-1 font-semibold ${event.attempt_count >= 4 ? 'text-rose-400' : 'text-text-secondary'}`}>
                                <RotateCcw className="h-3 w-3" /> {event.attempt_count} retry attempts
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right column items (badge, actions, timestamp) */}
                      <div className="flex items-center gap-4 flex-shrink-0">
                        
                        {/* Hover Quick Action Buttons */}
                        <div className="hidden group-hover:flex items-center gap-1.5 transition-all">
                          {event.status === 'FAILED' && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReplay(event.id);
                                }}
                                disabled={actionLoading === `replay-${event.id}`}
                                className="p-1 px-2 text-[10px] font-bold bg-indigo-600 hover:bg-primary-light0 text-white rounded-[2px] transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                {actionLoading === `replay-${event.id}` ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <RotateCcw className="h-3 w-3" />
                                )}
                                Replay
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleResolve(event.id);
                                }}
                                disabled={actionLoading === `resolve-${event.id}`}
                                className="p-1 px-2 text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 rounded-[2px] transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                Mark OK
                              </button>
                            </>
                          )}
                        </div>

                        <StatusBadge status={event.status} />

                        <span className="text-[10px] text-text-secondary font-mono w-16 text-right">
                          {new Date(event.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>

                        <ChevronRight className={`h-4 w-4 text-text-secondary group-hover:text-text-muted transition-transform ${isSelected ? 'rotate-90 text-indigo-400' : ''}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-6">
                <button
                  onClick={() => loadEvents(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="px-3 py-1.5 text-xs font-semibold border border-slate-800 bg-slate-950 text-text-muted hover:text-slate-200 rounded-[2px] hover:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Previous
                </button>
                <span className="text-xs text-text-muted font-mono">Page {pagination.page} of {pagination.totalPages}</span>
                <button
                  onClick={() => loadEvents(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-3 py-1.5 text-xs font-semibold border border-slate-800 bg-slate-950 text-text-muted hover:text-slate-200 rounded-[2px] hover:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── Pane 3: Right Event Inspector debugging cockpit Panel ─── */}
      <div className={`w-100 border-l border-slate-800 bg-slate-950/80  flex flex-col transition-all duration-300 ${
        selectedEvent ? 'translate-x-0 opacity-100' : 'translate-x-full w-0 opacity-0 overflow-hidden'
      }`}>
        {selectedEvent && (
          <>
            {/* Inspector Header */}
            <div className="p-4 border-b border-slate-850 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Debugging Cockpit</p>
                <p className="text-xs font-bold text-slate-200 mt-1 truncate">Event ID #{selectedEvent.id} · {selectedEvent.event_type}</p>
              </div>
              <button 
                onClick={() => setSelectedEvent(null)}
                className="p-1 rounded-[2px] hover:bg-slate-800 text-text-muted hover:text-slate-200 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Inspector Navigation Tabs */}
            <div className="flex border-b border-slate-850 px-2">
              {[
                { id: 'OVERVIEW', label: 'Timeline', icon: Clock },
                { id: 'PAYLOAD', label: 'Payload', icon: Database },
                { id: 'LOGS', label: 'Worker Logs', icon: Terminal },
                { id: 'GRAPH', label: 'Relations', icon: Layers },
              ].map(tab => {
                const TabIcon = tab.icon;
                const active = inspectorTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setInspectorTab(tab.id as any)}
                    className={`flex-1 flex items-center justify-center gap-1 py-2 text-[10px] font-bold border-b-2 transition-all cursor-pointer ${
                      active 
                        ? 'border-indigo-500 text-indigo-400' 
                        : 'border-transparent text-text-secondary hover:text-slate-350'
                    }`}
                  >
                    <TabIcon className="h-3.5 w-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab content panel */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              
              {/* Tab 1: Overview and Retry Timeline */}
              {inspectorTab === 'OVERVIEW' && (
                <div className="space-y-4">
                  {/* Status Card */}
                  <div className="bg-slate-900 border border-slate-850 rounded-[2px] p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-text-secondary uppercase font-semibold">Workflow Status</span>
                      <StatusBadge status={selectedEvent.status} />
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs border-t border-slate-850 pt-3">
                      <div>
                        <span className="text-text-secondary block text-[10px] uppercase">Created At</span>
                        <span className="text-slate-200 font-mono mt-0.5 block">{new Date(selectedEvent.created_at).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-text-secondary block text-[10px] uppercase">Processed At</span>
                        <span className="text-slate-200 font-mono mt-0.5 block">
                          {selectedEvent.processed_at ? new Date(selectedEvent.processed_at).toLocaleString() : '--'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Retry Stats */}
                  <div className="bg-slate-900 border border-slate-850 rounded-[2px] p-4 space-y-2">
                    <span className="text-[10px] text-text-secondary uppercase font-semibold block mb-1">Retry Counter Graph</span>
                    <div className="flex items-center gap-4">
                      <div className="relative h-12 w-12 flex-shrink-0 flex items-center justify-center rounded-[2px] bg-slate-950 border border-slate-800">
                        <span className="text-sm font-bold text-slate-300">{selectedEvent.attempt_count}</span>
                        <span className="text-[8px] text-slate-550 absolute bottom-1">/ 5</span>
                      </div>
                      <div className="text-xs">
                        <p className="font-bold text-slate-200">Attempt Count Details</p>
                        <p className="text-[10px] text-text-secondary mt-0.5">
                          {selectedEvent.attempt_count >= 5 
                            ? 'Maximum failures reached. Dead-letter queue (DLQ) locked.'
                            : 'Attempts remain inside safe operations interval.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Error Logger Panel */}
                  {selectedEvent.last_error && (
                    <div className="bg-rose-950/20 border border-rose-900/40 rounded-[2px] p-4 space-y-2">
                      <span className="text-[10px] text-rose-450 uppercase font-bold flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5" /> Dead-Letter Failure Log
                      </span>
                      <pre className="text-[10px] text-rose-350 bg-slate-950/80 p-2.5 rounded-[2px] font-mono overflow-x-auto border border-rose-950/50 whitespace-pre-wrap break-all">
                        {selectedEvent.last_error}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Code Editor Payload JSON */}
              {inspectorTab === 'PAYLOAD' && (
                <div className="space-y-2 h-full flex flex-col">
                  <span className="text-[10px] text-text-secondary uppercase font-semibold">Transactional Payload Data</span>
                  <div className="flex-1 bg-slate-950 rounded-[2px] p-3 border border-slate-850 overflow-x-auto font-mono text-[11px] leading-relaxed text-emerald-400">
                    <pre className="whitespace-pre-wrap break-all">{JSON.stringify(selectedEvent.payload, null, 2)}</pre>
                  </div>
                </div>
              )}

              {/* Tab 3: Terminal Console Output Emulator */}
              {inspectorTab === 'LOGS' && (
                <div className="space-y-2 h-full flex flex-col">
                  <span className="text-[10px] text-text-secondary uppercase font-semibold">Worker Stdout Exec logs</span>
                  
                  <div className="flex-1 bg-black rounded-[2px] p-3 border border-slate-850 font-mono text-[10px] leading-relaxed text-slate-300 space-y-2 overflow-y-auto h-80">
                    {simulatedConsoleLogs.map((log, index) => {
                      let textClass = 'text-text-muted';
                      if (log.includes('[SUCCESS]')) textClass = 'text-emerald-400 font-bold';
                      else if (log.includes('[ERROR]') || log.includes('[FATAL]')) textClass = 'text-rose-400 font-bold';
                      else if (log.includes('[WARNING]')) textClass = 'text-amber-400 font-semibold';
                      return (
                        <div key={index} className={`${textClass} break-words`}>
                          {log}
                        </div>
                      );
                    })}
                    <div className=" text-indigo-400">_</div>
                  </div>
                </div>
              )}

              {/* Tab 4: Interactive Related Entity Graph Map */}
              {inspectorTab === 'GRAPH' && (
                <div className="space-y-4">
                  <span className="text-[10px] text-text-secondary uppercase font-semibold block">System Entity Mappings</span>
                  
                  <div className="bg-slate-900 border border-slate-850 rounded-[2px] p-4 flex flex-col items-center justify-center space-y-4">
                    {/* Node 1: Outbox Event */}
                    <div className="w-full bg-slate-950 border border-slate-800 rounded-[2px] p-2.5 text-center flex flex-col items-center">
                      <Workflow className="h-4 w-4 text-indigo-400 mb-1" />
                      <span className="text-[9px] font-bold text-text-secondary uppercase">Event Hook</span>
                      <span className="text-xs font-semibold text-slate-200 mt-0.5">{selectedEvent.event_type}</span>
                    </div>

                    <div className="h-6 w-0.5 bg-slate-850 relative">
                      <ArrowRight className="h-3 w-3 text-text-secondary absolute top-1.5 -left-1.5 rotate-90" />
                    </div>

                    {/* Node 2: Database Record reference */}
                    <div className="w-full bg-slate-950 border border-slate-800 rounded-[2px] p-2.5 text-center flex flex-col items-center">
                      <Database className="h-4 w-4 text-amber-500 mb-1" />
                      <span className="text-[9px] font-bold text-text-secondary uppercase">Aggregate Entity</span>
                      <span className="text-xs font-semibold text-slate-200 mt-0.5 capitalize">{selectedEvent.aggregate_type} #{selectedEvent.aggregate_id}</span>
                    </div>

                    <div className="h-6 w-0.5 bg-slate-850 relative">
                      <ArrowRight className="h-3 w-3 text-text-secondary absolute top-1.5 -left-1.5 rotate-90" />
                    </div>

                    {/* Node 3: Affected service context */}
                    <div className="w-full bg-slate-950 border border-slate-800 rounded-[2px] p-2.5 text-center flex flex-col items-center">
                      <Settings className="h-4 w-4 text-purple-400 mb-1" />
                      <span className="text-[9px] font-bold text-text-secondary uppercase">Downstream Action</span>
                      <span className="text-xs font-semibold text-purple-300 mt-0.5">
                        {selectedEvent.event_type === 'STUDENT_ENROLLED' ? 'Generate Sem Invoice' :
                         selectedEvent.event_type === 'INVOICE_GENERATED' ? 'Dispatch Billing Notification' :
                         selectedEvent.event_type === 'PAYMENT_RECEIVED' ? 'Update Ledger Accounts' :
                         selectedEvent.event_type === 'GRADES_PUBLISHED' ? 'Re-index Grade Sheet' :
                         selectedEvent.event_type === 'COURSE_COMPLETED' ? 'Recalculate Degree Audit' : 'Trigger Engine Handlers'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Actions panel footer */}
            <div className="p-4 border-t border-slate-850 bg-slate-950 space-y-2">
              <span className="text-[10px] text-text-secondary uppercase font-bold tracking-wider block mb-2">Control Plane Actions</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleForceRetry(selectedEvent.id)}
                  disabled={actionLoading === `force-${selectedEvent.id}`}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-semibold py-2 rounded-[2px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {actionLoading === `force-${selectedEvent.id}` ? (
                    <Loader2 className="h-3 w-3 animate-spin text-amber-500" />
                  ) : (
                    <RotateCcw className="h-3 w-3 text-amber-500" />
                  )}
                  Force Retry
                </button>
                <button
                  onClick={() => handleResolve(selectedEvent.id)}
                  disabled={actionLoading === `resolve-${selectedEvent.id}`}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-semibold py-2 rounded-[2px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {actionLoading === `resolve-${selectedEvent.id}` ? (
                    <Loader2 className="h-3 w-3 animate-spin text-emerald-500" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  )}
                  Mark Resolved
                </button>
              </div>

              {selectedEvent.status === 'FAILED' && (
                <button
                  onClick={() => handleReplay(selectedEvent.id)}
                  disabled={actionLoading === `replay-${selectedEvent.id}`}
                  className="w-full mt-1 bg-indigo-600 hover:bg-primary-light0 text-white text-xs font-semibold py-2 rounded-[2px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {actionLoading === `replay-${selectedEvent.id}` ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Play className="h-3.5 w-3.5 fill-current" />
                  )}
                  Replay (Reset Attempts)
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* ─── Modal Panel: Inject Manual Outbox Event ─── */}
      {showInjectModal && (
        <div className="fixed inset-0 bg-black/60  z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-850 w-full max-w-lg rounded-[2px] overflow-hidden shadow-none flex flex-col">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-850 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-slate-200">Inject Manual Outbox Event</h3>
                <p className="text-[10px] text-text-secondary font-mono">Bypasses client services, directly triggers transactions</p>
              </div>
              <button 
                onClick={() => setShowInjectModal(false)}
                className="p-1 rounded-[2px] hover:bg-slate-800 text-text-muted hover:text-slate-200 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Preset select ribbons */}
            <div className="p-4 bg-slate-900/50 border-b border-slate-850 flex flex-wrap gap-1.5 items-center">
              <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider mr-2">Preset Presets:</span>
              {[
                'STUDENT_ENROLLED',
                'INVOICE_GENERATED',
                'PAYMENT_RECEIVED',
                'GRADES_PUBLISHED',
                'COURSE_COMPLETED'
              ].map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setInjectPreset(type)}
                  className={`text-[9px] font-semibold px-2 py-1 rounded transition-colors cursor-pointer ${
                    injectForm.event_type === type
                      ? 'bg-primary text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-text-muted hover:text-slate-200'
                  }`}
                >
                  {type.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* Injection Form */}
            <form onSubmit={handleInjectSubmit} className="p-4 space-y-4 flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-text-secondary uppercase">Event Type Hook</label>
                  <input
                    type="text"
                    required
                    value={injectForm.event_type}
                    onChange={e => setInjectForm(f => ({ ...f, event_type: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-800 px-3 py-2 rounded-[2px] text-xs focus:outline-none focus:border-indigo-500 text-slate-200"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-text-secondary uppercase">Aggregate Type</label>
                  <input
                    type="text"
                    required
                    value={injectForm.aggregate_type}
                    onChange={e => setInjectForm(f => ({ ...f, aggregate_type: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-800 px-3 py-2 rounded-[2px] text-xs focus:outline-none focus:border-indigo-500 text-slate-200"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-text-secondary uppercase">Aggregate Record ID (Int)</label>
                <input
                  type="number"
                  required
                  value={injectForm.aggregate_id}
                  onChange={e => setInjectForm(f => ({ ...f, aggregate_id: Number(e.target.value) }))}
                  className="w-full bg-slate-900 border border-slate-800 px-3 py-2 rounded-[2px] text-xs focus:outline-none focus:border-indigo-500 text-slate-200"
                />
              </div>

              <div className="space-y-1.5 flex-1 flex flex-col">
                <label className="text-[10px] font-bold text-text-secondary uppercase">JSON Payload Block</label>
                <textarea
                  required
                  rows={5}
                  value={injectForm.payloadStr}
                  onChange={e => setInjectForm(f => ({ ...f, payloadStr: e.target.value }))}
                  className="w-full flex-1 bg-slate-950 border border-slate-850 p-3 rounded-[2px] text-xs font-mono focus:outline-none focus:border-indigo-500 text-emerald-400 whitespace-pre"
                />
              </div>

              {/* Form submit/cancel */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => setShowInjectModal(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-text-muted hover:text-slate-200 text-xs font-semibold rounded-[2px] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-primary-light0 text-white text-xs font-semibold rounded-[2px] transition-colors cursor-pointer"
                >
                  Inject Event
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      </div>
    </DashboardLayout>
  );
}

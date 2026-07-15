'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { UserRole } from '@/types/types';
import { Landmark, ArrowLeft, Plus, X, Award, Calculator, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useCurrentProfile } from '@/features/profile/hooks/useProfile';
import { useFeePlans, useCreateFeePlan } from '@/features/finance/hooks/useFinance';

export default function FeesConfigPage() {
  const { data: profile } = useCurrentProfile();
  const displayName = profile?.fullName || profile?.username || 'Administrator';

  const { data: feePlans, isLoading, error } = useFeePlans();
  const createPlanMut = useCreateFeePlan();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [programId, setProgramId] = useState('1');
  const [tuition, setTuition] = useState('');
  const [labFee, setLabFee] = useState('');
  const [regFee, setRegFee] = useState('');

  const scholarships = [
    { id: 1, title: 'Merit-Based Scholarship', criteria: 'CGPA >= 3.8', discount: '50% Tuition Waiver', activeStudents: 42 },
    { id: 2, title: 'Need-Based Financial Aid', criteria: 'Income Assessment', discount: '30% - 100% Waiver', activeStudents: 88 },
    { id: 3, title: 'Sports Scholarship', criteria: 'National/Provincial Level athlete', discount: '25% Tuition Waiver', activeStudents: 14 },
  ];

  const handleAddPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tuition || !labFee || !regFee) return;

    await createPlanMut.mutateAsync({
      programid: Number(programId),
      tuitionpercredit: Number(tuition),
      labfees: Number(labFee),
      registrationfee: Number(regFee)
    });

    setIsAddModalOpen(false);
    setTuition('');
    setLabFee('');
    setRegFee('');
  };

  return (
    <DashboardLayout
      userRole={UserRole.ADMIN}
      userName={displayName}
      currentPath="/dashboard/admin/finance/fees"
      notifications={[]}
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8  space-y-8 text-text-primary">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/admin/finance" className="p-2 bg-background hover:bg-slate-200 text-text-secondary rounded-[2px] transition-all">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest">
                <Landmark className="w-3.5 h-3.5" /> Finance Module
              </div>
              <h1 className="text-3xl font-semibold text-text-primary ">Tuition & Fee Structures</h1>
            </div>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-900 text-white font-bold text-xs rounded-[2px] hover:bg-slate-800 transition-colors uppercase tracking-wider"
          >
            <Plus className="w-3.5 h-3.5" /> Add Plan
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active Fee Plans */}
          <div className="lg:col-span-2 bg-surface rounded-[2px] p-6 border border-border shadow-none space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Active Fee Plans</h2>
              <p className="text-text-muted text-xs font-semibold">Tuition rates categorized by academic program (Base: PKR)</p>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-[2px] animate-spin"></div>
                <p className="text-xs font-semibold text-text-muted">Loading fee plans...</p>
              </div>
            ) : error ? (
              <div className="p-4 bg-error-bg text-error-text rounded-[2px] text-xs font-semibold">
                Failed to load fee structures.
              </div>
            ) : feePlans?.length === 0 ? (
              <div className="text-center py-16 text-text-muted text-xs font-semibold">
                No fee plans configure in database. Click "Add Plan" to create one.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="pb-3 text-[10px] font-semibold uppercase text-text-muted tracking-wider">Program Code</th>
                      <th className="pb-3 text-[10px] font-semibold uppercase text-text-muted tracking-wider">Program Name</th>
                      <th className="pb-3 text-[10px] font-semibold uppercase text-text-muted tracking-wider">Per Credit</th>
                      <th className="pb-3 text-[10px] font-semibold uppercase text-text-muted tracking-wider">Lab Fee</th>
                      <th className="pb-3 text-[10px] font-semibold uppercase text-text-muted tracking-wider">Reg. Fee</th>
                      <th className="pb-3 text-[10px] font-semibold uppercase text-text-muted tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {feePlans?.map((plan) => (
                      <tr key={plan.feeplanid} className="hover:bg-surface-hover/50 transition-colors">
                        <td className="py-3.5 text-xs font-mono font-bold text-text-muted">{plan.program?.code || `PROG-${plan.programid}`}</td>
                        <td className="py-3.5 text-xs font-bold text-text-primary">{plan.program?.name || 'Departmental Core'}</td>
                        <td className="py-3.5 text-xs font-semibold text-slate-950">PKR {Number(plan.tuitionpercredit).toLocaleString()}</td>
                        <td className="py-3.5 text-xs font-semibold text-text-secondary">PKR {Number(plan.labfees).toLocaleString()}</td>
                        <td className="py-3.5 text-xs font-semibold text-text-secondary">PKR {Number(plan.registrationfee).toLocaleString()}</td>
                        <td className="py-3.5 text-xs">
                          <span className="px-2 py-0.5 rounded bg-background text-success-text text-[10px] font-bold uppercase border border-border">
                            {plan.isactive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right column - Scholarships & Aid */}
          <div className="space-y-8">
            <div className="bg-surface rounded-[2px] p-6 border border-border shadow-none space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  Scholarships & Aid
                </h2>
                <p className="text-text-muted text-xs font-semibold">Active institutional discount policies</p>
              </div>

              <div className="space-y-4">
                {scholarships.map((s) => (
                  <div key={s.id} className="p-4 rounded-[2px] border border-border hover:bg-surface-hover/50 transition-all flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <h3 className="font-bold text-text-primary text-sm">{s.title}</h3>
                      <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Criteria: {s.criteria}</p>
                      <span className="inline-block mt-2 px-2 py-0.5 bg-primary-light text-primary rounded text-[10px] font-bold uppercase border border-border">
                        {s.discount}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-text-secondary shrink-0">{s.activeStudents} active</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-r bg-primary text-white rounded-[2px] p-6 shadow-none shadow-blue-100 space-y-4">
              <div className="flex items-center gap-3">
                <Calculator className="w-6 h-6 shrink-0" />
                <h3 className="font-semibold text-lg">Billing Generator</h3>
              </div>
              <p className="text-white/80 text-xs leading-relaxed">
                Semester billing runs evaluate student course loads in real-time, applying discount configurations configured on this page.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Fee Plan Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60  flex items-center justify-center p-4 z-50 ">
          <div className="bg-surface rounded-[2px] w-full max-w-md shadow-none border border-border overflow-hidden text-text-primary">
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-semibold text-sm uppercase tracking-wider">Add Program Fee Plan</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 text-text-muted hover:text-white rounded-[2px] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPlan} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Target Program ID</label>
                <select
                  value={programId}
                  onChange={e => setProgramId(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-[2px] focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-xs font-bold text-text-primary bg-surface"
                >
                  <option value="1">BS Computer Science (ID 1)</option>
                  <option value="2">BS Electrical Engineering (ID 2)</option>
                  <option value="3">BBA Business Admin (ID 3)</option>
                  <option value="4">MS Software Engineering (ID 4)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Tuition Per Credit (PKR)</label>
                <input
                  type="number"
                  required
                  value={tuition}
                  onChange={e => setTuition(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full px-3 py-2 border border-border rounded-[2px] focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-xs font-bold text-text-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Laboratory Fee (PKR)</label>
                <input
                  type="number"
                  required
                  value={labFee}
                  onChange={e => setLabFee(e.target.value)}
                  placeholder="e.g. 2000"
                  className="w-full px-3 py-2 border border-border rounded-[2px] focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-xs font-bold text-text-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Registration Fee (PKR)</label>
                <input
                  type="number"
                  required
                  value={regFee}
                  onChange={e => setRegFee(e.target.value)}
                  placeholder="e.g. 1500"
                  className="w-full px-3 py-2 border border-border rounded-[2px] focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-xs font-bold text-text-primary"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={createPlanMut.isPending}
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-[2px] flex items-center justify-center gap-1.5 uppercase tracking-wider transition-colors"
                >
                  {createPlanMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Fee Plan'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 border border-border text-text-primary hover:bg-surface-hover font-bold text-xs rounded-[2px] uppercase tracking-wider transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

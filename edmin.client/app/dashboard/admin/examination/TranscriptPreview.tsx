'use client';

import { useRef } from 'react';
import { 
    Printer, ArrowLeft, RefreshCw, AlertTriangle, ShieldAlert, Check
} from 'lucide-react';
import Link from 'next/link';
import { useStudentTranscript } from '@/features/examination/hooks/useExamination';

interface TranscriptPreviewProps {
    studentId: number;
}

export default function TranscriptPreview({ studentId }: TranscriptPreviewProps) {
    const { data: transcript, isLoading, error } = useStudentTranscript(studentId);
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        if (typeof window !== 'undefined') {
            window.print();
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-text-muted font-bold gap-3 bg-surface-hover">
                <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                Loading Official Transcript...
            </div>
        );
    }

    if (error || !transcript) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-text-secondary font-bold gap-4 p-8 text-center bg-surface-hover">
                <ShieldAlert className="w-16 h-16 text-rose-500" />
                <div>
                    <h3 className="text-xl font-semibold text-text-primary">Transcript Not Found</h3>
                    <p className="text-sm text-text-muted mt-1">Failed to query transcript database record.</p>
                </div>
                <Link 
                    href="/dashboard/admin/examination?tab=transcripts"
                    className="bg-primary hover:bg-primary-hover text-white font-bold px-6 py-3 rounded-[2px] transition-all text-sm shadow-none"
                >
                    Return to Directory
                </Link>
            </div>
        );
    }

    const { student, semesters, summary } = transcript;

    return (
        <div className="py-4 px-2 print:p-0 print:bg-surface print:min-h-0">
            {/* Control Bar (Hidden on Print) */}
            <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center bg-surface p-4 rounded-[2px] border border-border/60 shadow-none print:hidden">
                <Link 
                    href="/dashboard/admin/examination?tab=transcripts"
                    className="inline-flex items-center gap-2 text-xs font-bold text-text-secondary hover:text-text-primary bg-surface-hover hover:bg-background/70 border border-border px-4 py-2.5 rounded-[2px] transition-all"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Examination Desk
                </Link>
                <button
                    onClick={handlePrint}
                    className="bg-primary hover:bg-primary-hover text-white font-semibold text-xs px-5 py-3 rounded-[2px] transition-all shadow-none flex items-center gap-1.5"
                >
                    <Printer className="w-4 h-4" /> Print / Export PDF
                </button>
            </div>

            {/* Print Document container */}
            <div 
                ref={printRef}
                className="max-w-4xl mx-auto bg-surface border border-border rounded-[2px] p-10 md:p-14 shadow-none font-serif text-text-primary print:border-0 print:shadow-none print:p-0 print:rounded-none"
            >
                {/* Official Letterhead */}
                <div className="border-b-4 border-slate-900 pb-6 text-center">
                    <h1 className="text-3xl font-semibold uppercase  font-serif text-text-primary leading-none">EDMIN UNIVERSITY</h1>
                    <p className="text-xs uppercase font-sans tracking-widest text-text-secondary mt-1 font-bold">Office of the Registrar & Controller of Examinations</p>
                    <h2 className="text-lg font-bold uppercase tracking-wide text-text-primary mt-4 border border-slate-900 inline-block px-6 py-1 bg-surface-hover/50">
                        OFFICIAL TRANSCRIPT OF ACADEMIC RECORD
                    </h2>
                </div>

                {/* Student info grid */}
                <div className="grid grid-cols-2 gap-y-3 gap-x-8 py-8 border-b-2 border-slate-300 text-sm">
                    <div>
                        <table className="w-full">
                            <tbody>
                                <tr>
                                    <td className="font-bold pr-2 py-1 font-sans text-xs text-text-secondary uppercase w-28">Name:</td>
                                    <td className="font-semibold font-serif text-text-primary">{student.fullname}</td>
                                </tr>
                                <tr>
                                    <td className="font-bold pr-2 py-1 font-sans text-xs text-text-secondary uppercase">Roll Number:</td>
                                    <td className="font-bold font-mono text-text-primary">{student.rollnumber}</td>
                                </tr>
                                <tr>
                                    <td className="font-bold pr-2 py-1 font-sans text-xs text-text-secondary uppercase">Email:</td>
                                    <td className="font-serif text-text-primary">{student.email}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div>
                        <table className="w-full">
                            <tbody>
                                <tr>
                                    <td className="font-bold pr-2 py-1 font-sans text-xs text-text-secondary uppercase w-28">Department:</td>
                                    <td className="font-semibold font-serif text-text-primary">{student.department}</td>
                                </tr>
                                <tr>
                                    <td className="font-bold pr-2 py-1 font-sans text-xs text-text-secondary uppercase">Dept Code:</td>
                                    <td className="font-mono text-text-primary">{student.departmentCode}</td>
                                </tr>
                                <tr>
                                    <td className="font-bold pr-2 py-1 font-sans text-xs text-text-secondary uppercase">Date Printed:</td>
                                    <td className="font-mono text-text-secondary">{new Date().toLocaleDateString()}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Course List Semesters */}
                <div className="py-8 space-y-8">
                    {semesters.map((sem, i) => (
                        <div key={i} className="space-y-3 avoid-break">
                            <h3 className="text-sm font-bold font-sans text-indigo-900 border-b border-indigo-200 pb-1 uppercase tracking-wider">
                                {sem.semesterName}
                            </h3>
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-slate-300 font-sans text-text-secondary font-bold uppercase">
                                        <th className="py-2 w-24">Course Code</th>
                                        <th className="py-2">Course Title</th>
                                        <th className="py-2 w-20 text-center">Credits</th>
                                        <th className="py-2 w-20 text-center">Letter Grade</th>
                                        <th className="py-2 w-20 text-right">Grade Points</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-serif">
                                    {sem.courses.map((c, idx) => (
                                        <tr key={idx}>
                                            <td className="py-2 font-mono font-bold">{c.courseCode}</td>
                                            <td className="py-2">{c.courseName}</td>
                                            <td className="py-2 text-center font-mono">{c.credits}</td>
                                            <td className="py-2 text-center font-bold font-mono text-sm">{c.grade}</td>
                                            <td className="py-2 text-right font-mono">
                                                {c.gradepoints !== null ? c.gradepoints.toFixed(1) : '---'}
                                            </td>
                                        </tr>
                                    ))}
                                    {sem.courses.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="py-4 text-center font-sans text-text-muted italic font-semibold">
                                                No graded courses in this semester.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                            
                            {/* Semester GPA summary */}
                            <div className="flex justify-end gap-6 text-xs bg-surface-hover p-3 rounded-[2px] border border-border font-sans print:bg-surface print:border-0 print:border-t print:border-slate-300 print:rounded-none">
                                <div>
                                    <span className="text-text-secondary uppercase font-bold tracking-wider">Semester Credits:</span>{' '}
                                    <strong className="font-mono text-text-primary">{sem.earnedCredits} hrs</strong>
                                </div>
                                <div className="w-px h-4 bg-slate-200 print:hidden"></div>
                                <div>
                                    <span className="text-text-secondary uppercase font-bold tracking-wider">Semester GPA (SGPA):</span>{' '}
                                    <strong className="font-mono text-primary text-sm">{sem.gpa.toFixed(2)}</strong>
                                </div>
                                <div className="w-px h-4 bg-slate-200 print:hidden"></div>
                                <div>
                                    <span className="text-text-secondary uppercase font-bold tracking-wider">Cumulative GPA (CGPA):</span>{' '}
                                    <strong className="font-mono text-text-primary">{sem.cgpa.toFixed(2)}</strong>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Final Summary at the bottom */}
                <div className="border-t-2 border-slate-300 pt-8 mt-10 grid grid-cols-2 gap-8 text-sm">
                    <div className="space-y-2">
                        <h4 className="font-sans text-xs font-semibold uppercase text-text-secondary tracking-wider">Academic Summary</h4>
                        <table className="w-full">
                            <tbody className="font-serif">
                                <tr>
                                    <td className="font-sans text-xs text-text-secondary uppercase py-1">Total Credits Completed:</td>
                                    <td className="font-bold font-mono">{summary.totalCredits} credit hours</td>
                                </tr>
                                <tr>
                                    <td className="font-sans text-xs text-text-secondary uppercase py-1">Cumulative CGPA:</td>
                                    <td className="font-bold font-mono text-indigo-800 text-lg">{summary.cgpa.toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td className="font-sans text-xs text-text-secondary uppercase py-1">Overall Standing:</td>
                                    <td className="font-bold">
                                        {student.status === 'ALUMNI' ? 'GRADUATED' : 
                                         summary.cgpa < 1.7 ? 'REPEAT_SEMESTER' :
                                         summary.cgpa < 2.0 ? 'ACADEMIC_PROBATION' : 'GOOD STANDING'}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Official Stamp & Sign */}
                    <div className="flex flex-col items-center justify-end text-center pt-8">
                        <div className="w-56 border-b border-slate-900 mb-2"></div>
                        <p className="font-sans text-xs font-bold uppercase text-text-primary">Controller of Examinations</p>
                        <p className="font-sans text-[10px] text-text-muted mt-1 uppercase">Edmin Registrar's Office seal is mandatory for validity.</p>
                    </div>
                </div>
            </div>

            {/* Print Optimized stylesheet overrides */}
            <style jsx global>{`
                @media print {
                    body {
                        background: white !important;
                        color: black !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    .app-sidebar, .app-navbar, .app-header, .print\\:hidden, header, nav, aside, button {
                        display: none !important;
                    }
                    .avoid-break {
                        page-break-inside: avoid !important;
                    }
                    main {
                        padding: 0 !important;
                        margin: 0 !important;
                        background: white !important;
                    }
                    div {
                        box-shadow-none: none !important;
                        border-radius: 0 !important;
                    }
                }
            `}</style>
        </div>
    );
}

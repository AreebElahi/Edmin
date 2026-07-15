export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <main
            className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden"
            style={{
                fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
                background: 'linear-gradient(150deg, #edf2fb 0%, #f0f4ff 35%, #eef1fb 65%, #e8eeff 100%)',
                WebkitFontSmoothing: 'antialiased',
                MozOsxFontSmoothing: 'grayscale',
            }}
        >
            {/* ── Ambient glow (barely visible, feels premium) ─────────────── */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
                {/* top-left radial */}
                <div style={{
                    position: 'absolute', top: '-20%', left: '-10%',
                    width: '60%', height: '60%', borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(0,120,212,0.08) 0%, transparent 68%)',
                    filter: 'blur(48px)',
                }} />
                {/* right radial */}
                <div style={{
                    position: 'absolute', top: '30%', right: '-12%',
                    width: '50%', height: '50%', borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(72,114,242,0.06) 0%, transparent 68%)',
                    filter: 'blur(48px)',
                }} />
                {/* bottom */}
                <div style={{
                    position: 'absolute', bottom: '-18%', left: '18%',
                    width: '45%', height: '45%', borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(0,100,190,0.05) 0%, transparent 68%)',
                    filter: 'blur(48px)',
                }} />

                {/* Diagonal micro-pattern — almost invisible */}
                <div style={{
                    position: 'absolute', inset: 0,
                    opacity: 0.022,
                    backgroundImage: 'repeating-linear-gradient(45deg, #2a2a4a 0, #2a2a4a 1px, transparent 0, transparent 50%)',
                    backgroundSize: '16px 16px',
                }} />
            </div>

            {/* ── Outer wrapper (controls max-width & page fade-in) ──────── */}
            <div
                className="relative z-10 w-full flex flex-col items-center"
                style={{
                    maxWidth: '540px',
                    width: '90vw',
                    padding: '32px 0 24px',
                    animation: 'pageIn 0.18s ease-out both',
                }}
            >
                {/* ── Auth Card ──────────────────────────────────────────── */}
                <div
                    className="w-full bg-surface"
                    style={{
                        borderRadius: '12px',
                        border: '1px solid #e1e4e8',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06), 0 12px 32px rgba(0,0,0,0.05)',
                        animation: 'cardIn 0.20s cubic-bezier(0.22, 1, 0.36, 1) both',
                    }}
                >
                    {children}
                </div>

                {/* ── Footer ─────────────────────────────────────────────── */}
                <p
                    className="text-center mt-5 text-[13px] leading-5"
                    style={{ color: 'rgba(107,114,128,0.75)' }}
                >
                    &copy; {new Date().getFullYear()} Edmin. All rights reserved.
                </p>
            </div>

            <style>{`
                @keyframes pageIn {
                    from { opacity: 0; }
                    to   { opacity: 1; }
                }
                @keyframes cardIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to   { opacity: 1; transform: translateY(0); }
                }

                /* ── Global Fluent input focus ring ─────────────────────── */
                .f-input:focus-within {
                    border-color: #0078d4 !important;
                    box-shadow: 0 0 0 3px rgba(0,120,212,0.16), 0 1px 4px rgba(0,120,212,0.08);
                    transition: border-color 0.12s, box-shadow 0.12s;
                }
                .f-input input  { outline: none !important; border: none !important; background: transparent; }
                .f-input button { outline: none; }
                .f-input button:focus-visible {
                    box-shadow: 0 0 0 2px #0078d4;
                    border-radius: 4px;
                }

                /* ── Fluent Primary Button ──────────────────────────────── */
                .f-btn {
                    background: #0f6cbd;
                    box-shadow: 0 1px 2px rgba(0,120,212,0.20);
                    transition: background 0.12s ease, box-shadow 0.12s ease, transform 0.08s ease;
                }
                .f-btn:hover:not(:disabled)  { background: #0c5ea6; box-shadow: 0 2px 6px rgba(0,120,212,0.28); }
                .f-btn:active:not(:disabled) { background: #094f8a; transform: scale(0.99); box-shadow: 0 1px 2px rgba(0,120,212,0.20); }
                .f-btn:disabled              { opacity: 0.58; cursor: not-allowed; }
                .f-btn:focus-visible         { outline: 2px solid #0078d4; outline-offset: 2px; }
            `}</style>
        </main>
    );
}

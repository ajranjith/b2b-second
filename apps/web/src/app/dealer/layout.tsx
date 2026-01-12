export default function DealerLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm">
                <div className="flex items-center gap-8">
                    <div className="text-xl font-bold text-blue-900 tracking-tight">Hotbray Portal</div>
                    <nav className="flex gap-6">
                        {/* Links */}
                    </nav>
                </div>
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">D</div>
                </div>
            </header>
            <main className="flex-1">
                {children}
            </main>
            <footer className="h-16 bg-white border-t border-slate-200 flex items-center justify-center text-sm text-slate-500">
                © 2024 Hotbray Ltd.
            </footer>
        </div>
    );
}

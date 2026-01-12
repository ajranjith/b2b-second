export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen bg-slate-50">
            {/* Sidebar could go here */}
            <aside className="w-64 bg-slate-900 text-white p-6 hidden md:block">
                <h2 className="text-xl font-bold mb-8">Admin Console</h2>
                <nav className="space-y-4">
                    <div className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Operations</div>
                    {/* Nav links */}
                </nav>
            </aside>
            <main className="flex-1 flex flex-col">
                <header className="h-16 bg-white border-b border-slate-200 flex items-center px-8">
                    <h1 className="font-semibold">Dashboard</h1>
                </header>
                <div className="flex-1">
                    {children}
                </div>
            </main>
        </div>
    );
}

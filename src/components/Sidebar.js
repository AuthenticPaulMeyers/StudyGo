export function renderSidebar(activeView = 'dashboard') {
    const navItems = [
        { id: 'dashboard', icon: 'dashboard', label: 'Dashboard', color: 'primary' },
        { id: 'timer', icon: 'timer', label: 'Focus Timer', color: 'secondary' },
        { id: 'subjects', icon: 'library_books', label: 'Subjects', color: 'emerald-500' }
    ];

    const version = "v1.0.0";

    return `
    <div class="p-6 mb-4 hidden md:block">
        <h1 class="text-3xl font-extrabold tracking-tight">
            <span class="bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">StudyGo</span>
        </h1>
        <p class="text-xs text-slate-500 mt-1 uppercase tracking-widest font-semibold ml-1">Student Companion</p>
    </div>
    
    <nav class="flex-1 px-2 md:px-4 flex flex-row md:flex-col justify-around md:justify-start gap-1 md:gap-3 w-full">
        ${navItems.map(item => `
            <button data-view="${item.id}" 
                class="nav-btn flex-1 md:w-full text-left md:px-5 py-3 md:py-4 rounded-xl md:rounded-2xl transition-all duration-300 flex flex-col md:flex-row items-center justify-center md:justify-start md:gap-4 group relative overflow-hidden
                ${activeView === item.id
            ? 'md:bg-slate-700/50 text-white md:shadow-lg md:shadow-' + item.color + '/20 md:ring-1 md:ring-white/10'
            : 'text-slate-400 hover:text-white hover:bg-white/5'}"
            >
                <div class="absolute inset-0 bg-gradient-to-r from-${item.color}/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity hidden md:block"></div>
                
                <span class="material-icons-outlined transition-transform duration-300 group-hover:scale-110 mb-1 md:mb-0 text-2xl md:text-2xl ${activeView === item.id ? 'text-' + item.color + ' drop-shadow-md' : ''}">${item.icon}</span>
                
                <span class="text-[10px] md:text-sm font-medium tracking-wide z-10 ${activeView === item.id ? 'text-white' : 'text-slate-500 md:text-slate-400'}">${item.label}</span>
                
                ${activeView === item.id ? `<div class="absolute top-0 md:top-auto md:right-4 w-full h-1 md:w-1.5 md:h-1.5 rounded-full bg-${item.color} shadow-[0_0_10px_currentColor] md:block hidden"></div>` : ''}
            </button>
        `).join('')}
    </nav>

    <div class="p-4 mt-auto hidden md:block">
        <div class="p-4 rounded-2xl bg-slate-800/30 border border-white/5 backdrop-blur-sm">
            <div class="flex items-center gap-3 text-slate-400 mb-3">
                 <span class="material-icons-outlined text-sm">info</span>
                 <span class="text-xs font-mono">${version}</span>
            </div>
            <div class="w-full">
                <button id="btn-settings" class="w-full text-center py-2.5 rounded-xl bg-slate-700/50 hover:bg-slate-700 text-sm font-medium text-slate-300 hover:text-white transition-colors">
                    Settings
                </button>
            </div>
        </div>
    </div>
  `;
}

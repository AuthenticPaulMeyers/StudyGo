export function renderSidebar(activeView = 'dashboard', isCollapsed = false) {
    const navItems = [
        { id: 'dashboard', icon: 'dashboard', label: 'Dashboard', color: 'primary' },
        { id: 'timer', icon: 'timer', label: 'Focus Timer', color: 'primary' },
        { id: 'subjects', icon: 'library_books', label: 'Subjects', color: 'primary' }
    ];

    const version = "v1.0.0";

    return `
    <div class="p-4 mb-2 hidden flex w-full md:flex items-center justify-between">
        <div class="${isCollapsed ? 'hidden' : 'block'} flex-1 whitespace-nowrap overflow-hidden">
            <h1 class="text-2xl font-extrabold tracking-tight">
                <span class="text-primary flex text-center items-center">StudyG
                    <span class="material-symbols-outlined">
                        motion_play
                    </span>
                </span>
            </h1>
            <p class="text-[10px] text-primary uppercase tracking-widest font-semibold ml-0.5">Student Companion</p>
        </div>
        <div class="${isCollapsed ? 'w-full flex justify-center' : ''}">
             <button id="btn-toggle-sidebar" class="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors">
                <span class="material-icons-outlined text-2xl">${isCollapsed ? 'menu_open' : 'menu'}</span>
             </button>
        </div>
    </div>
    
    <nav class="flex-1 px-3 space-y-2 flex flex-row md:flex-col justify-around md:justify-start gap-1 w-full">
        ${navItems.map(item => `
            <button data-view="${item.id}" 
                class="nav-btn w-full text-left px-3 py-3 rounded-xl transition-all duration-300 flex flex-col md:flex-row items-center justify-center ${isCollapsed ? '' : 'md:justify-start md:gap-3'} group relative overflow-hidden
                ${activeView === item.id
            ? 'md:bg-slate-700/50 text-white md:shadow-lg md:shadow-' + item.color + '/20 md:ring-1 md:ring-white/10'
            : 'text-slate-400 hover:text-white hover:bg-white/5'}"
                title="${isCollapsed ? item.label : ''}"
            >
                <!-- Active BG Gradient -->
                <div class="absolute inset-0 bg-gradient-to-r from-${item.color}/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity hidden md:block"></div>
                
                <!-- Icon -->
                <span class="material-icons-outlined transition-transform duration-300 group-hover:scale-110 mb-1 md:mb-0 text-2xl md:text-2xl ${activeView === item.id ? 'text-' + item.color + ' drop-shadow-md' : ''}">${item.icon}</span>
                
                <!-- Label -->
                <span class="text-[10px] md:text-sm font-medium tracking-wide z-10 ${isCollapsed ? 'hidden' : 'hidden md:block'} ${activeView === item.id ? 'text-white' : 'text-slate-500 md:text-slate-400'}">${item.label}</span>
                
                <!-- Active Indicator (Right Bar) -->
                ${activeView === item.id ? `<div class="absolute top-0 md:top-auto md:right-0 md:h-full w-full h-1 md:w-1 rounded-full bg-${item.color} shadow-[0_0_10px_currentColor] md:block hidden"></div>` : ''}
            </button>
        `).join('')}
    </nav>

    <div class="p-3 mt-auto hidden w-full md:block">
        <!-- Version -->
        <div class="${isCollapsed ? 'hidden' : 'block'} text-[10px] text-slate-500 font-mono mb-1 pl-3">
            ${version}
        </div>
        
        <!-- Logout Button -->
        <button id="btn-logout" class="w-full text-left px-3 py-3 rounded-xl hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors flex items-center justify-center ${isCollapsed ? '' : 'md:justify-start md:gap-3'} group relative overflow-hidden">
             <span class="material-icons-outlined transition-transform duration-500 text-2xl">logout</span>
             <span class="${isCollapsed ? 'hidden' : 'block'} text-sm font-medium">Logout</span>
        </button>
    </div>
  `;
}

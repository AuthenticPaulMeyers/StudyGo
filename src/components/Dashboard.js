import { renderActivityGraph, initGraphLogic } from './ActivityGraph.js';
import { getSubjects, getDB, updateSettings } from '../utils/storage.js';
import { openModal, closeModal } from './Modal.js';
import confetti from 'canvas-confetti';

export function renderDashboard() {
    // Calculate Stats
    const db = getDB();
    const subjects = db.subjects || [];
    const sessions = db.sessions || [];
    const settings = db.settings || { weeklyGoal: 10 };

    // Use Global Weekly Goal from Settings
    const totalGoalHours = settings.weeklyGoal || 10;

    // Calculate hours done in last 7 days
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const sevenDaysAgo = now - (7 * oneDay);
    const fourteenDaysAgo = now - (14 * oneDay);

    // Period 1: Last 7 days
    const p1Duration = sessions
        .filter(s => s.timestamp >= sevenDaysAgo)
        .reduce((acc, s) => acc + s.duration, 0);

    // Period 2: Previous 7 days
    const p2Duration = sessions
        .filter(s => s.timestamp >= fourteenDaysAgo && s.timestamp < sevenDaysAgo)
        .reduce((acc, s) => acc + s.duration, 0);

    const hoursDone = p1Duration / 3600;
    const prevHours = p2Duration / 3600;

    const progress = totalGoalHours > 0 ? (hoursDone / totalGoalHours) * 100 : 0;
    const cappedProgress = Math.min(100, progress);

    // Determine remaining
    const remainingHours = Math.max(0, totalGoalHours - hoursDone);

    // Velocity Calculation
    let velocityLabel = 'Stable';
    let velocityColor = 'text-slate-400';
    let velocityIcon = 'remove';

    if (prevHours > 0) {
        const change = ((hoursDone - prevHours) / prevHours) * 100;
        if (change > 5) {
            velocityLabel = `+${Math.round(change)}%`;
            velocityColor = 'text-emerald-400';
            velocityIcon = 'trending_up';
        } else if (change < -5) {
            velocityLabel = `${Math.round(change)}%`;
            velocityColor = 'text-red-400';
            velocityIcon = 'trending_down';
        }
    } else if (hoursDone > 0) {
        velocityLabel = '+100%';
        velocityColor = 'text-emerald-400';
        velocityIcon = 'trending_up';
    }

    // Recent Sessions
    const recentSessions = sessions
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 3)
        .map(s => {
            const sub = subjects.find(sub => sub.id === s.subjectId) || { name: 'Unknown', color: '#64748b' };
            const date = new Date(s.timestamp).toLocaleDateString();
            const mins = Math.round(s.duration / 60);

            // Topic Name if exists
            let topicName = '';
            if (s.topicId && sub.topics) {
                const t = sub.topics.find(t => t.id === s.topicId);
                if (t) topicName = t.name;
            }

            return `
                    <div class="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                        <div class="flex items-center gap-3">
                            <div class="w-2 h-8 rounded-full" style="background-color: ${sub.color}"></div>
                            <div>
                                <div class="text-sm font-bold text-slate-200">${sub.name}</div>
                                <div class="text-xs text-slate-400 flex gap-2">
                                    <span>${date}</span>
                                    ${topicName ? `<span class="text-slate-500">• ${topicName}</span>` : ''}
                                </div>
                            </div>
                        </div>
                        <div class="text-sm font-mono font-medium text-slate-300">${mins}m</div>
                    </div>
                `;
        }).join('');

    // Trigger Confetti if goal met (Logic handled in init to avoid render loops, but markup here)
    const isGoalMet = hoursDone >= totalGoalHours && totalGoalHours > 0;

    return `
        <header class="mb-8 flex items-center justify-between animate-fade-in">
            <div>
                <h2 class="text-3xl font-bold text-white mb-2">Welcome back, Scholar</h2>
                <p class="text-slate-400">Here is your daily progress overview.</p>
            </div>
            
             <div class="hidden md:flex items-center gap-2 bg-white/5 border border-white/5 px-4 py-2 rounded-xl">
                 <span class="text-xs text-slate-400 uppercase tracking-wider font-medium">Velocity</span>
                 <span class="material-icons-outlined text-sm ${velocityColor}">${velocityIcon}</span>
                 <span class="text-sm font-bold ${velocityColor}">${velocityLabel}</span>
                 <span class="text-xs text-slate-500 ml-1">vs last 7d</span>
             </div>
        </header>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- Activity Graph (Spans 2 cols) -->
            <div class="lg:col-span-2 space-y-8 animate-slide-up">
                ${renderActivityGraph()}
                
                <!-- Recent Activity -->
                 <div class="bg-surface/50 backdrop-blur-xl border border-white/5 p-6 rounded-3xl shadow-xl">
                    <h3 class="text-lg font-bold text-white mb-4">Recent Sessions</h3>
                    ${recentSessions.length > 0 ? `
                        <div class="space-y-3">
                            ${recentSessions}
                        </div>
                    ` : `
                        <div class="text-slate-400 text-center py-8 flex flex-col items-center gap-4">
                            <span class="material-icons-outlined text-4xl text-slate-600">history</span>
                            <p>No recent sessions. Start the timer to track!</p>
                        </div>
                    `}
                </div>
            </div>

            <!-- Side Stats (right col) -->
            <div class="space-y-8 animate-slide-up" style="animation-delay: 100ms;">
                 <!-- Goals Card -->
                 <div class="bg-gradient-to-br from-primary to-indigo-600 p-6 rounded-3xl shadow-lg shadow-primary/20 text-white relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
                    <div class="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:bg-white/20 transition-colors"></div>
                    <div class="relative z-10">
                        <div class="flex justify-between items-start mb-1">
                            <div class="text-indigo-200 text-sm font-medium">Weekly Goal</div>
                            <button id="icon-edit-goal" class="text-white/50 hover:text-white transition-colors" title="Edit Goal">
                                <span class="material-icons-outlined text-sm">edit</span>
                            </button>
                        </div>
                        
                        <div class="text-4xl font-bold mb-2 break-words text-wrap flex flex-wrap items-baseline gap-2">
                             ${isGoalMet ?
            `<span>GOAL MET!</span>` :
            `<span>${Math.round(remainingHours * 10) / 10}h</span> <span class="text-lg opacity-70">Remaining</span>`
        }
                        </div>
                        
                        <div class="w-full bg-black/20 rounded-full h-2 mt-4 overflow-hidden">
                             <div class="bg-white h-full rounded-full transition-all duration-1000" style="width: ${cappedProgress}%"></div>
                        </div>
                        
                        <div class="flex justify-between mt-2 text-xs text-indigo-100/80">
                             <span>${Math.round(hoursDone * 10) / 10}h done</span>
                             <span>Goal: ${totalGoalHours}h</span>
                        </div>
                    </div>
                 </div>

                 <!-- Tip Card / Velocity Mobile -->
                 <div class="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-3xl shadow-lg shadow-emerald-500/20 text-white relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
                    <div class="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors"></div>
                     <h4 class="font-bold text-lg mb-2 flex items-center gap-2">
                        <span class="material-icons-outlined">lightbulb</span>
                        ${isGoalMet ? 'Great Job!' : 'Daily Tip'}
                     </h4>
                     <p class="text-emerald-50 text-sm leading-relaxed">
                        ${isGoalMet ?
            "You've crushed your weekly goal. Maintain your streak or rest up!" :
            "Consistency beats intensity. 20 minutes every day is better than 5 hours once a week."
        }
                     </p>
                 </div>
            </div>
        </div>
    `;
}

export function initDashboardLogic() {
    initGraphLogic();

    // Check Goal Met for Confetti
    // Simple check: get data again or parse.
    const db = getDB();
    const settings = db.settings || { weeklyGoal: 10 };
    const sessions = db.sessions || [];
    const totalGoalHours = settings.weeklyGoal || 10;

    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const sevenDaysAgo = now - (7 * oneDay);

    const p1Duration = sessions
        .filter(s => s.timestamp >= sevenDaysAgo)
        .reduce((acc, s) => acc + s.duration, 0);
    const hoursDone = p1Duration / 3600;

    if (hoursDone >= totalGoalHours && totalGoalHours > 0) {
        // Trigger confetti if not already celebrated? 
        // For now, trigger on load if met. 
        // To avoid annoyance, maybe chance or check against a 'celebrated' flag?
        // Let's just fire it once lightly.
        const end = Date.now() + 1000;
        const colors = ['#6366f1', '#10b981'];

        (function frame() {
            confetti({
                particleCount: 2,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: colors
            });
            confetti({
                particleCount: 2,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: colors
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        }());
    }

    const handleEditGoal = () => {
        const db = getDB();
        const currentGoal = db.settings?.weeklyGoal || 10;

        openModal(`
            <div class="bg-surface border border-white/10 p-8 rounded-3xl shadow-2xl w-full max-w-md">
                 <h3 class="text-2xl font-bold text-white mb-6">Set Weekly Goal</h3>
                 
                 <div class="space-y-6">
                    <div>
                       <label class="block text-sm font-medium text-slate-400 mb-2">Target Hours per Week</label>
                       <div class="relative">
                           <input type="number" id="inp-weekly-goal" min="1" max="168" value="${currentGoal}" class="w-full bg-slate-900 border border-slate-700/50 rounded-xl p-4 pl-4 text-white outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono text-xl">
                           <span class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">hrs</span>
                       </div>
                       <p class="text-xs text-slate-500 mt-2">Recommended: 10-20 hours for consistent progress.</p>
                    </div>

                    <div class="flex justify-end gap-3 pt-6 border-t border-white/5">
                        <button id="btn-cancel-goal" class="text-slate-400 hover:text-white px-5 py-3 rounded-xl hover:bg-white/5 transition-colors font-medium">Cancel</button>
                        <button id="btn-save-goal" class="bg-primary hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold transition-all hover:shadow-lg hover:shadow-primary/25">Save Goal</button>
                    </div>
                 </div>
            </div>
        `);

        setTimeout(() => {
            const inp = document.getElementById('inp-weekly-goal');
            if (inp) inp.focus();

            const cancel = document.getElementById('btn-cancel-goal');
            if (cancel) cancel.addEventListener('click', closeModal);

            const save = document.getElementById('btn-save-goal');
            if (save) save.addEventListener('click', () => {
                const val = inp.value;
                const parsed = parseFloat(val);
                if (!isNaN(parsed) && parsed > 0) {
                    updateSettings({ weeklyGoal: parsed });
                    closeModal();
                    document.dispatchEvent(new CustomEvent('nav-refresh'));
                } else {
                    alert("Please enter a valid number of hours.");
                }
            });
        }, 50);
    };

    const iconEdit = document.getElementById('icon-edit-goal');
    if (iconEdit) iconEdit.addEventListener('click', handleEditGoal);
}

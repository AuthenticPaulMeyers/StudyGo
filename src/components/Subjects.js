import { getSubjects, getDB, addTopic, deleteTopic, updateSubjectColor, addSubject, deleteSubject } from '../utils/storage.js';
import { openModal, closeModal } from './Modal.js';
import { showToast } from './Toast.js';
import { showConfirm } from './ConfirmModal.js';

export function renderSubjects(db) {
    if (!db) return '<div class="text-slate-400">Loading subjects...</div>';
    const subjects = db.subjects || [];

    return `
    <div class="max-w-7xl mx-auto space-y-8 animate-fade-in">
        <header class="flex items-center justify-between">
            <div>
                <h2 class="text-3xl font-bold text-white">Subjects & Goals</h2>
                <p class="text-slate-400">Manage learning paths and track specific topic progress.</p>
            </div>
            <button id="btn-add-subject" class="bg-primary hover:bg-indigo-500 shadow-lg shadow-primary/25 text-white px-5 py-3 rounded-2xl flex items-center gap-2 transition-all hover:scale-105 active:scale-95">
                <span class="material-icons-outlined">add</span>
                New Subject
            </button>
        </header>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${subjects.map(sub => renderSubjectCard(sub, db.sessions || [])).join('')}
        </div>
    </div>
    `;
}

function renderSubjectCard(sub, allSessions) {
    const topicCount = sub.topics ? sub.topics.length : 0;

    // Calculate REAL spent hours from sessions
    const totalSpent = allSessions
        .filter(s => String(s.subject_id) === String(sub.id))
        .reduce((acc, s) => acc + s.duration, 0) / 3600;

    // Target is sum of topic targets
    const totalTarget = sub.topics ? sub.topics.reduce((acc, t) => acc + (parseFloat(t.target_hours) || 0), 0) : 0;

    const progress = totalTarget > 0 ? (totalSpent / totalTarget) * 100 : 0;
    const cappedProgress = Math.min(100, progress);
    const visibleProgress = progress > 0 ? Math.max(cappedProgress, 2) : 0;

    return `
    <div class="subject-card bg-surface/40 backdrop-blur-md border border-white/5 p-6 rounded-3xl group hover:bg-surface/60 transition-all relative overflow-hidden flex flex-col cursor-pointer" data-id="${sub.id}">
        <div class="absolute left-0 top-0 bottom-0 w-1.5 transition-colors duration-300" style="background-color: ${sub.color}"></div>
        
        <div class="flex items-start justify-between mb-6 pl-3">
            <div class="flex items-center gap-4">
                <div class="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-inner transition-colors duration-300" style="background-color: ${sub.color}20; color: ${sub.color}">
                    ${sub.name.charAt(0).toUpperCase()}
                </div>
                <div>
                    <h3 class="font-bold text-slate-100 text-xl leading-tight group-hover:text-white transition-colors">${sub.name}</h3>
                    <div class="text-xs text-slate-400 mt-1 flex items-center gap-2">
                         <span class="bg-white/5 px-2 py-0.5 rounded text-slate-300">${topicCount} Topics</span>
                         <span>${totalSpent.toFixed(1)}h studied</span>
                    </div>
                </div>
            </div>
            
            <div class="flex flex-col gap-2 md:opacity-0 md:group-hover:opacity-100 transition-all md:translate-x-4 md:group-hover:translate-x-0" onclick="event.stopPropagation()">
                <button class="btn-color-picker w-8 h-8 rounded-full border border-white/10 flex items-center justify-center bg-white/5 md:bg-transparent hover:bg-white/10 transition-colors" data-id="${sub.id}" title="Change Color">
                    <div class="w-3 h-3 rounded-full" style="background-color: ${sub.color}"></div>
                </button>
                <button class="btn-delete-sub text-slate-500 hover:text-red-400 w-8 h-8 rounded-full border border-white/10 flex items-center justify-center bg-white/5 md:bg-transparent hover:bg-red-500/10 transition-colors" data-id="${sub.id}" title="Delete Subject">
                    <span class="material-icons-outlined text-sm">delete</span>
                </button>
            </div>
        </div>
        
        <div class="pl-3 mt-auto space-y-4 pointer-events-none">
            <!-- Progress Bar -->
            <div>
                <div class="flex justify-between items-end mb-2">
                    <span class="text-xs font-medium text-slate-400">Total Progress</span>
                    <span class="text-xs font-bold text-slate-300">${Math.round(progress)}%</span>
                </div>
                <div class="w-full bg-slate-900/50 rounded-full h-2 overflow-hidden border border-white/5">
                    <div class="h-full rounded-full transition-all duration-1000" style="width: ${visibleProgress}%; background-color: ${sub.color}"></div>
                </div>
            </div>

             <!-- Topics Preview Tags -->
             ${sub.topics && sub.topics.length > 0 ? `
             <div class="flex flex-wrap gap-2 pt-2">
                ${sub.topics.slice(0, 3).map(t => `
                    <span class="text-[10px] px-2 py-1 rounded-lg bg-white/5 text-slate-300 border border-white/5 truncate max-w-[120px] shadow-sm">
                        ${t.name}
                    </span>
                `).join('')}
                ${sub.topics.length > 3 ? `<span class="text-[10px] px-2 py-1 text-slate-500">+${sub.topics.length - 3}</span>` : ''}
             </div>
             ` : '<p class="text-xs text-slate-600 italic pt-2">No topics initialized.</p>'}
        </div>
        
        <div class="absolute bottom-4 right-4 text-xs font-medium text-slate-500 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 flex items-center gap-1">
            Manage Details <span class="material-icons-outlined text-xs">arrow_forward</span>
        </div>
    </div>
    `;
}

export function initSubjectsLogic(db) {
    if (!db) return;
    // Add Subject Button
    const btnAdd = document.getElementById('btn-add-subject');
    if (btnAdd) {
        btnAdd.addEventListener('click', () => openAddSubjectModal(db));
    }

    // Card Click (Drill Down)
    document.querySelectorAll('.subject-card').forEach(card => {
        card.addEventListener('click', () => {
            const id = card.dataset.id;
            openSubjectDetailsModal(id, db);
        });
    });

    // Inline Actions (Stop Propagation handled in HTML, just attach logic)
    // Delete
    document.querySelectorAll('.btn-delete-sub').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = btn.dataset.id;
            if (await showConfirm('Deleting this subject will permanently remove all associated topics and progress. This action cannot be undone.', 'Delete Subject?')) {
                await deleteSubject(id);
                showToast('Subject deleted successfully', 'success');
                document.dispatchEvent(new CustomEvent('nav-refresh'));
            }
        });
    });

    // Color Picker
    document.querySelectorAll('.btn-color-picker').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = btn.dataset.id;
            e.stopPropagation();
            openSubjectDetailsModal(id, db);
        });
    });
}

function openAddSubjectModal() {
    openModal(`
        <div class="bg-surface border border-white/10 p-8 rounded-3xl shadow-2xl w-full max-w-lg">
             <h3 class="text-2xl font-bold text-white mb-6">Create New Subject</h3>
             
             <div class="space-y-6">
                <!-- Name -->
                <div>
                   <label class="block text-sm font-medium text-slate-400 mb-2">Subject Name</label>
                   <input type="text" id="inp-sub-name" class="w-full bg-slate-900 border border-slate-700/50 rounded-xl p-4 text-white outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-slate-600" placeholder="e.g. Advanced Calculus" autocomplete="off">
                </div>

                <!-- Color -->
                <div>
                   <label class="block text-sm font-medium text-slate-400 mb-2">Color Code</label>
                   <div class="flex flex-wrap gap-3">
                        ${['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6', '#14b8a6'].map((c, i) => `
                            <button type="button" class="w-8 h-8 rounded-full border-2 border-transparent hover:scale-110 transition-transform color-select ${i === 0 ? 'ring-2 ring-white ring-offset-2 ring-offset-surface' : ''}" style="background-color: ${c}" data-color="${c}"></button>
                        `).join('')}
                        <input type="hidden" id="inp-sub-color" value="#6366f1">
                   </div>
                </div>

                <div class="flex justify-end gap-3 pt-6 border-t border-white/5">
                    <button id="btn-cancel-sub" class="text-slate-400 hover:text-white px-5 py-3 rounded-xl hover:bg-white/5 transition-colors font-medium">Cancel</button>
                    <button id="btn-save-sub" class="bg-primary hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold transition-all hover:shadow-lg hover:shadow-primary/25">Create Subject</button>
                </div>
             </div>
        </div>
    `);

    setTimeout(() => {
        document.getElementById('inp-sub-name').focus();
        document.getElementById('btn-cancel-sub').addEventListener('click', closeModal);

        const colorInput = document.getElementById('inp-sub-color');
        document.querySelectorAll('.color-select').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.color-select').forEach(b => b.classList.remove('ring-2', 'ring-white', 'ring-offset-2', 'ring-offset-surface'));
                btn.classList.add('ring-2', 'ring-white', 'ring-offset-2', 'ring-offset-surface');
                colorInput.value = btn.dataset.color;
            });
        });

        document.getElementById('btn-save-sub').addEventListener('click', async () => {
            const name = document.getElementById('inp-sub-name').value;
            const color = document.getElementById('inp-sub-color').value;

            if (name) {
                await addSubject(name, color);
                closeModal();
                document.dispatchEvent(new CustomEvent('nav-refresh'));
            }
        });
    }, 50);
}

function openSubjectDetailsModal(subjectId, db) {
    const subject = db.subjects.find(s => s.id === subjectId);
    if (!subject) return;

    const renderTopicList = () => {
        if (!subject.topics || subject.topics.length === 0) {
            return `<div class="text-center py-10 text-slate-500 italic border-2 border-dashed border-white/5 rounded-2xl">
                No topics yet. Add one to start tracking detail!
            </div>`;
        }

        return subject.topics.map(t => {
            const topicSpent = (db.sessions || [])
                .filter(s => String(s.topic_id) === String(t.id))
                .reduce((acc, s) => acc + s.duration, 0) / 3600;
            const pct = t.target_hours > 0 ? (topicSpent / t.target_hours) * 100 : 0;

            return `
            <div class="flex items-center gap-4 bg-slate-900/30 p-4 rounded-xl border border-white/5 hover:bg-slate-900/50 transition-colors group">
                <div class="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 text-slate-400 font-bold shrink-0">
                    ${t.name.substring(0, 2).toUpperCase()}
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex justify-between items-center mb-1">
                        <h4 class="font-bold text-slate-200 truncate">${t.name}</h4>
                        <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button class="text-xs text-red-400 hover:text-red-300 btn-del-topic" data-tid="${t.id}">Delete</button>
                        </div>
                    </div>
                    <div class="flex items-center gap-3">
                        <div class="flex-1 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div class="h-full rounded-full transition-all duration-100" style="width: ${Math.min(100, pct)}%; background-color: ${subject.color}"></div>
                        </div>
                        <span class="text-xs font-mono text-slate-400 whitespace-nowrap">${Math.round(topicSpent * 10) / 10} / ${t.target_hours}h</span>
                    </div>
                </div>
            </div>
            `;
        }).join('');
    };

    openModal(`
        <div class="bg-surface border border-white/10 rounded-3xl shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col">
             <!-- Header -->
             <div class="p-8 pb-4 border-b border-white/5 flex justify-between items-start shrink-0">
                 <div class="flex gap-4">
                     <div class="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-inner" style="background-color: ${subject.color}20; color: ${subject.color}">
                        ${subject.name.charAt(0).toUpperCase()}
                     </div>
                     <div>
                         <h3 class="text-2xl font-bold text-white">${subject.name}</h3>
                         <div class="flex items-center gap-2 mt-1">
                             <div class="w-3 h-3 rounded-full" style="background-color: ${subject.color}"></div>
                             <span class="text-sm text-slate-400">${subject.topics ? subject.topics.length : 0} Topics Defined</span>
                         </div>
                     </div>
                 </div>
                 <button id="btn-close-modal" class="text-slate-400 hover:text-white p-2 hover:bg-white/5 rounded-full transition-colors">
                    <span class="material-icons-outlined">close</span>
                 </button>
             </div>
             
             <!-- Content -->
             <div class="flex-1 overflow-y-auto p-8 custom-scrollbar">
                 <div class="flex items-center justify-between mb-4">
                     <h4 class="text-lg font-bold text-white">Topics & Progress</h4>
                 </div>
                 
                 <!-- Enhanced Topic Input UI -->
                 <div class="bg-white/5 rounded-2xl p-2.5 mb-8 border border-white/5 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 group focus-within:border-primary/30 transition-colors">
                      <input type="text" id="inp-quick-topic" placeholder="Add new topic..." class="bg-transparent border-none text-white placeholder:text-slate-500 focus:ring-0 flex-1 min-w-0 outline-none font-medium px-2 py-2" autocomplete="off">
                      
                      <div class="flex items-center gap-3">
                        <div class="flex-1 sm:flex-none flex items-center bg-slate-900/50 p-1 rounded-xl border border-white/5">
                             <input type="number" id="inp-quick-hours" placeholder="Target Hrs" class="bg-transparent border-none text-white text-sm w-full sm:w-24 p-1.5 outline-none focus:ring-0 text-center font-mono placeholder:text-slate-600" autocomplete="off">
                        </div>
  
                        <button id="btn-quick-add" class="bg-primary hover:bg-indigo-500 text-white w-full sm:w-10 h-10 flex items-center justify-center rounded-xl transition-all hover:scale-105 active:scale-95 shrink-0">
                             <span class="material-icons-outlined text-lg">add</span>
                             <span class="sm:hidden ml-2 font-bold">Add Topic</span>
                        </button>
                      </div>
                 </div>
                 
                 <div class="space-y-3" id="topic-list-container">
                     ${renderTopicList()}
                 </div>
             </div>
             
             <!-- Footer -->
             <div class="p-6 border-t border-white/5 bg-black/20 shrink-0">
                  <div class="text-xs text-slate-500 flex items-center gap-2">
                     <span class="material-icons-outlined text-sm">lightbulb</span>
                     Pro Tip: Break down large subjects into smaller chunks (2-5 hours).
                  </div>
             </div>
        </div>
    `);

    setTimeout(() => {
        document.getElementById('btn-close-modal').addEventListener('click', closeModal);

        // Add Topic Logic
        const handleAdd = async () => {
            const name = document.getElementById('inp-quick-topic').value;
            const hours = document.getElementById('inp-quick-hours').value;

            if (name && hours) {
                await addTopic(subject.id, name, hours);
                document.getElementById('inp-quick-topic').value = '';
                document.getElementById('inp-quick-hours').value = '';

                // Refresh modal content by re-triggering details with fresh DB
                closeModal();
                const freshDB = await getDB();
                openSubjectDetailsModal(subjectId, freshDB);
                document.dispatchEvent(new CustomEvent('nav-refresh'));
            }
        };

        const attachDelListeners = () => {
            document.querySelectorAll('.btn-del-topic').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const tid = btn.dataset.tid;
                    await deleteTopic(subject.id, tid);

                    // Refresh modal
                    closeModal();
                    const freshDB = await getDB();
                    openSubjectDetailsModal(subjectId, freshDB);
                    document.dispatchEvent(new CustomEvent('nav-refresh'));
                });
            });
        };

        const btnAddTopic = document.getElementById('btn-quick-add');
        if (btnAddTopic) btnAddTopic.addEventListener('click', handleAdd);

        attachDelListeners();
    }, 50);
}

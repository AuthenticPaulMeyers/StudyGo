import { getSubjects, addSession } from '../utils/storage.js';

let timerInterval;
let remainingArgs = 0; // seconds
let initialDuration = 0;
let isRunning = false;
let isPaused = false;
let currentSubjectId = null;
let currentTopicId = null;
let isZenMode = false;

export function renderTimer() {
      const subjects = getSubjects();
      // Only subjects options. Topic options populate via JS
      const subOptions = subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('');

      return `
    <div class="w-full max-w-xl mx-auto">
        <div class="bg-surface/50 backdrop-blur-xl border border-white/5 p-8 rounded-3xl shadow-2xl relative overflow-hidden group">
            <div class="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            
            <header class="flex justify-between items-center mb-8 relative z-10">
                <h2 class="text-2xl font-bold text-white">Focus Timer</h2>
                <div class="px-3 py-1 bg-white/5 rounded-full text-xs font-mono text-slate-400 transform transition-all" id="timer-status">IDLE</div>
            </header>
            
            <!-- Timer Display -->
            <div class="relative py-8 mb-8 text-center">
                 <div class="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-primary/20 blur-3xl opacity-20 animate-pulse pointer-events-none" id="timer-glow"></div>
                 
                 <div id="setup-view" class="transition-all duration-300 relative z-10">
                    <div class="flex items-center justify-center gap-4 mb-6">
                        <div class="text-center group/input">
                            <input type="number" id="inp-hrs" min="0" max="23" value="0" class="w-20 h-20 bg-slate-900/50 border border-white/10 rounded-2xl text-4xl text-center text-white outline-none focus:border-primary transition-colors font-mono hover:bg-white/5 focus:bg-white/5">
                            <div class="text-xs text-slate-500 mt-2 uppercase tracking-wider group-hover/input:text-primary transition-colors">Hours</div>
                        </div>
                        <span class="text-4xl text-slate-600 font-bold mb-6">:</span>
                        <div class="text-center group/input">
                            <input type="number" id="inp-mins" min="0" max="59" value="25" class="w-20 h-20 bg-slate-900/50 border border-white/10 rounded-2xl text-4xl text-center text-white outline-none focus:border-primary transition-colors font-mono hover:bg-white/5 focus:bg-white/5">
                            <div class="text-xs text-slate-500 mt-2 uppercase tracking-wider group-hover/input:text-primary transition-colors">Minutes</div>
                        </div>
                    </div>
                    
                    <div class="flex flex-wrap justify-center gap-2 max-w-xs mx-auto mb-6">
                        <button class="btn-preset px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-medium transition-all hover:scale-105 active:scale-95" data-m="15">15m</button>
                        <button class="btn-preset px-4 py-2 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary text-sm font-medium transition-all hover:scale-105 active:scale-95" data-m="25">25m</button>
                        <button class="btn-preset px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-medium transition-all hover:scale-105 active:scale-95" data-m="45">45m</button>
                        <button class="btn-preset px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-medium transition-all hover:scale-105 active:scale-95" data-m="60">60m</button>
                    </div>

                    <!-- Zen Toggle -->
                    <label class="inline-flex items-center cursor-pointer gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors">
                        <div class="relative">
                            <input type="checkbox" id="chk-zen-mode" class="sr-only peer">
                            <div class="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </div>
                        <span class="text-sm font-medium text-slate-300">Enable Zen Mode</span>
                    </label>
                 </div>

                 <div id="countdown-view" class="hidden transition-all duration-300">
                     <div id="timer-display" class="text-8xl font-mono font-bold text-center tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 drop-shadow-2xl">
                        00:00:00
                     </div>
                 </div>
            </div>

            <!-- Controls -->
            <div class="space-y-4 relative z-10">
                <div class="grid grid-cols-2 gap-4">
                     <!-- Subject Select -->
                    <div class="relative">
                        <select id="timer-subject" class="w-full p-3 pl-10 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none cursor-pointer text-sm">
                            <option value="" disabled selected>Subject</option>
                            ${subjects.length ? subOptions : ''}
                        </select>
                        <span class="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">category</span>
                        <span class="material-icons-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-lg">expand_more</span>
                    </div>
                    
                    <!-- Topic Select -->
                    <div class="relative">
                        <select id="timer-topic" class="w-full p-3 pl-10 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none cursor-pointer text-sm disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                            <option value="" selected>Topic (Optional)</option>
                        </select>
                        <span class="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">topic</span>
                        <span class="material-icons-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-lg">expand_more</span>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4" id="control-buttons">
                    <button id="btn-start" class="col-span-2 btn-primary py-4 rounded-xl font-bold uppercase tracking-wider shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:-translate-y-0.5 active:translate-y-0 text-white bg-primary flex items-center justify-center gap-2">
                        <span class="material-icons-outlined">play_arrow</span> Start Session
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Zen Mode Overlay -->
    <div id="zen-overlay" class="fixed inset-0 bg-slate-900 z-50 flex flex-col items-center justify-center hidden opacity-0 transition-opacity duration-700">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-slate-900 to-slate-900"></div>
        
        <div class="relative z-10 text-center">
             <h3 class="text-2xl text-slate-400 font-light mb-8 tracking-[0.2em] uppercase">Flow State</h3>
             
             <!-- Circular Progress -->
             <div class="relative w-80 h-80 mx-auto flex items-center justify-center mb-12">
                 <svg class="w-full h-full transform -rotate-90 drop-shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                     <circle cx="160" cy="160" r="150" stroke="currentColor" stroke-width="4" fill="transparent" class="text-slate-800" />
                     <circle cx="160" cy="160" r="150" stroke="currentColor" stroke-width="4" fill="transparent" class="text-primary transition-all duration-1000 ease-linear" stroke-dasharray="942" stroke-dashoffset="0" stroke-linecap="round" id="zen-progress" />
                 </svg>
                 <div class="absolute inset-0 flex items-center justify-center">
                      <span id="zen-display" class="text-6xl font-mono font-bold text-white tracking-widest">00:00</span>
                 </div>
             </div>

             <button id="btn-zen-stop" class="group relative px-8 py-3 bg-transparent border border-white/10 rounded-full text-slate-400 hover:text-white hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-all overflow-hidden">
                  <span class="relative z-10 text-sm font-medium tracking-wider uppercase">End Session</span>
             </button>
        </div>
    </div>
    `;
}

export function initTimerLogic() {
      const display = document.getElementById('timer-display');
      const setupView = document.getElementById('setup-view');
      const countdownView = document.getElementById('countdown-view');

      const btnStart = document.getElementById('btn-start');
      const selectSub = document.getElementById('timer-subject');
      const selectTopic = document.getElementById('timer-topic');
      const controlContainer = document.getElementById('control-buttons');
      const chkZen = document.getElementById('chk-zen-mode');

      const inpHrs = document.getElementById('inp-hrs');
      const inpMins = document.getElementById('inp-mins');

      const zenOverlay = document.getElementById('zen-overlay');
      const zenDisplay = document.getElementById('zen-display');
      const zenProgress = document.getElementById('zen-progress');
      const btnZenStop = document.getElementById('btn-zen-stop');

      if (!btnStart) return;

      // Logic for Subject/Topic Select
      selectSub.addEventListener('change', () => {
            const subId = selectSub.value;
            const subjects = getSubjects();
            const sub = subjects.find(s => s.id === subId);

            selectTopic.innerHTML = '<option value="" selected>Topic (Optional)</option>';

            if (sub && sub.topics && sub.topics.length > 0) {
                  selectTopic.disabled = false;
                  sub.topics.forEach(t => {
                        const opt = document.createElement('option');
                        opt.value = t.id;
                        opt.textContent = t.name;
                        selectTopic.appendChild(opt);
                  });
            } else {
                  selectTopic.disabled = true;
            }
      });

      const renderControls = (state) => {
            // state: 'idle', 'running', 'paused'
            if (state === 'idle') {
                  controlContainer.innerHTML = `
                <button id="btn-start" class="col-span-2 btn-primary py-4 rounded-xl font-bold uppercase tracking-wider shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:-translate-y-0.5 active:translate-y-0 text-white bg-primary flex items-center justify-center gap-2">
                    <span class="material-icons-outlined">play_arrow</span> Start Session
                </button>
              `;
                  document.getElementById('btn-start').addEventListener('click', startTimer);
            } else if (state === 'running') {
                  controlContainer.innerHTML = `
                <button id="btn-pause" class="btn-secondary py-4 rounded-xl font-bold uppercase tracking-wider shadow-lg shadow-yellow-500/25 transition-all text-white bg-yellow-500 hover:bg-yellow-600 flex items-center justify-center gap-2">
                    <span class="material-icons-outlined">pause</span> Pause
                </button>
                <button id="btn-reset" class="btn-secondary py-4 rounded-xl font-bold uppercase tracking-wider shadow-lg shadow-red-500/25 transition-all text-white bg-slate-700 hover:bg-slate-600 flex items-center justify-center gap-2">
                    <span class="material-icons-outlined">restart_alt</span> Cancel
                </button>
              `;
                  document.getElementById('btn-pause').addEventListener('click', pauseTimer);
                  document.getElementById('btn-reset').addEventListener('click', resetTimer);
            } else if (state === 'paused') {
                  controlContainer.innerHTML = `
                <button id="btn-resume" class="btn-primary py-4 rounded-xl font-bold uppercase tracking-wider shadow-lg shadow-green-500/25 transition-all text-white bg-green-500 hover:bg-green-600 flex items-center justify-center gap-2">
                    <span class="material-icons-outlined">play_arrow</span> Resume
                </button>
                <button id="btn-finish-early" class="btn-secondary py-4 rounded-xl font-bold uppercase tracking-wider shadow-lg shadow-primary/25 transition-all text-white bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center gap-2">
                    <span class="material-icons-outlined">check_circle</span> Finish
                </button>
              `;
                  document.getElementById('btn-resume').addEventListener('click', resumeTimer);
                  document.getElementById('btn-finish-early').addEventListener('click', () => {
                        if (confirm('Finish session early and save progress?')) {
                              const elapsed = initialDuration - remainingArgs;
                              finishTimer(elapsed);
                        }
                  });
            }
      };

      const updateDisplay = () => {
            const hrs = Math.floor(remainingArgs / 3600).toString().padStart(2, '0');
            const mins = Math.floor((remainingArgs % 3600) / 60).toString().padStart(2, '0');
            const secs = (remainingArgs % 60).toString().padStart(2, '0');
            const timeStr = `${hrs}:${mins}:${secs}`;

            display.textContent = timeStr;
            document.title = `${timeStr} - Focus`;

            if (isZenMode && zenDisplay) {
                  zenDisplay.textContent = hrs > 0 ? `${hrs}:${mins}:${secs}` : `${mins}:${secs}`;
                  // Update circle
                  const total = initialDuration;
                  const current = remainingArgs;
                  const pct = total > 0 ? current / total : 0;
                  const dashArray = 942; // 2 * pi * 150
                  zenProgress.style.strokeDashoffset = dashArray * (1 - pct);
            }
      };

      function startTimer() {
            if (!selectSub.value) {
                  alert('Please select a subject first!');
                  return;
            }

            const hrs = parseInt(inpHrs.value) || 0;
            const mins = parseInt(inpMins.value) || 0;

            if (hrs === 0 && mins === 0) {
                  alert('Please set a duration!');
                  return;
            }

            remainingArgs = (hrs * 3600) + (mins * 60);
            initialDuration = remainingArgs;
            currentSubjectId = selectSub.value;
            currentTopicId = selectTopic.value || null;
            isZenMode = chkZen.checked;

            isRunning = true;
            isPaused = false;

            // Lock Navigation
            document.dispatchEvent(new CustomEvent('toggle-nav', { detail: { locked: true } }));

            // UI Transition
            setupView.classList.add('hidden');
            countdownView.classList.remove('hidden');
            selectSub.disabled = true;
            selectTopic.disabled = true;

            document.getElementById('timer-status').textContent = 'FOCUS MODE';
            document.getElementById('timer-status').className = 'px-3 py-1 bg-primary/20 text-primary rounded-full text-xs font-mono animate-pulse';

            if (isZenMode) {
                  zenOverlay.classList.remove('hidden');
                  // Trigger animation
                  requestAnimationFrame(() => zenOverlay.classList.remove('opacity-0'));
                  // Add beforeunload
                  window.onbeforeunload = () => "Focus session active!";
            }

            updateDisplay();
            renderControls('running');

            runInterval();
      }

      function runInterval() {
            clearInterval(timerInterval);
            timerInterval = setInterval(() => {
                  if (remainingArgs > 0) {
                        remainingArgs--;
                        updateDisplay();
                  } else {
                        finishTimer(); // Time ran out, full duration
                  }
            }, 1000);
      }

      function pauseTimer() {
            clearInterval(timerInterval);
            isPaused = true;
            document.getElementById('timer-status').textContent = 'PAUSED';
            document.getElementById('timer-status').className = 'px-3 py-1 bg-yellow-500/20 text-yellow-500 rounded-full text-xs font-mono';
            renderControls('paused');
      }

      function resumeTimer() {
            isPaused = false;
            document.getElementById('timer-status').textContent = 'FOCUS MODE';
            document.getElementById('timer-status').className = 'px-3 py-1 bg-primary/20 text-primary rounded-full text-xs font-mono animate-pulse';
            renderControls('running');
            runInterval();
      }

      function resetTimer() {
            clearInterval(timerInterval);
            isRunning = false;
            isPaused = false;
            remainingArgs = 0;
            document.title = 'StudyGo';
            window.onbeforeunload = null;

            // Unlock Navigation
            document.dispatchEvent(new CustomEvent('toggle-nav', { detail: { locked: false } }));

            // UI Reset
            setupView.classList.remove('hidden');
            countdownView.classList.add('hidden');
            selectSub.disabled = false;
            selectTopic.disabled = !selectSub.value; // Reset based on selection logic
            if (selectSub.value && getSubjects().find(s => s.id === selectSub.value).topics.length > 0) selectTopic.disabled = false;

            document.getElementById('timer-status').textContent = 'IDLE';
            document.getElementById('timer-status').className = 'px-3 py-1 bg-white/5 rounded-full text-xs font-mono text-slate-400';

            zenOverlay.classList.add('opacity-0');
            setTimeout(() => zenOverlay.classList.add('hidden'), 500);

            renderControls('idle');
      }

      function finishTimer(actualDuration = null) {
            clearInterval(timerInterval);
            isRunning = false;
            window.onbeforeunload = null;

            // Unlock Navigation
            document.dispatchEvent(new CustomEvent('toggle-nav', { detail: { locked: false } }));

            const durationToSave = actualDuration !== null ? actualDuration : initialDuration;

            // Only save if meaningful duration (> 1 minute maybe? User didn't specify, saving all)
            if (durationToSave > 0) {
                  // Save Session
                  const session = {
                        id: Date.now().toString(),
                        subjectId: currentSubjectId,
                        topicId: currentTopicId,
                        duration: durationToSave,
                        timestamp: Date.now()
                  };
                  addSession(session);

                  // Notification
                  try {
                        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                        audio.play().catch(e => console.log('Audio play failed', e));
                  } catch (e) { }

                  alert(`Session Complete! Saved ${Math.round(durationToSave / 60)} minutes.`);
            }

            resetTimer();

            document.dispatchEvent(new CustomEvent('nav-refresh'));
      }

      if (btnZenStop) {
            btnZenStop.addEventListener('click', () => {
                  if (confirm('End session and save progress?')) {
                        const elapsed = initialDuration - remainingArgs;
                        finishTimer(elapsed);
                  }
            });
      }

      // Preset Logic
      document.querySelectorAll('.btn-preset').forEach(btn => {
            btn.addEventListener('click', () => {
                  const m = parseInt(btn.dataset.m);
                  if (m === 60) {
                        inpHrs.value = 1;
                        inpMins.value = 0;
                  } else {
                        inpHrs.value = 0;
                        inpMins.value = m;
                  }

                  // Visual feedback
                  document.querySelectorAll('.btn-preset').forEach(b => {
                        b.classList.remove('bg-primary/20', 'text-primary');
                        b.classList.add('bg-white/5', 'text-slate-300');
                  });
                  btn.classList.remove('bg-white/5', 'text-slate-300');
                  btn.classList.add('bg-primary/20', 'text-primary');
            });
      });

      // Init Events
      renderControls('idle');
}

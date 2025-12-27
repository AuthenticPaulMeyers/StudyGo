import Chart from 'chart.js/auto';
import { getDB, getSubjects } from '../utils/storage.js';
import { eachDayOfInterval, subDays, format, startOfWeek, endOfYear, startOfYear } from 'date-fns';
import { openModal, closeModal } from './Modal.js';

let chartInstance = null;
let selectedYear = new Date().getFullYear();

export function renderActivityGraph(db) {
      if (!db) return '<div class="text-slate-400">Loading activity...</div>';
      const sessions = db.sessions || [];

      // Calculate total sessions for selected year
      const yearStart = startOfYear(new Date(selectedYear, 0, 1));
      const yearEnd = endOfYear(new Date(selectedYear, 11, 31));
      const sessionCount = sessions.filter(s => {
            const d = new Date(s.timestamp);
            return d >= yearStart && d <= yearEnd;
      }).length;

      // Dynamic Year List (Starting from 2025)
      const currentYear = new Date().getFullYear();
      const startYear = 2025;
      const years = [];
      for (let y = Math.max(currentYear, startYear); y >= startYear; y--) {
            years.push(y);
      }

      const yearButtons = years.map(y => `
            <button class="year-btn px-4 py-2 rounded-lg text-xs font-bold transition-all ${y === selectedYear ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'hover:bg-white/5 text-slate-400'}" data-year="${y}">
                ${y}
            </button>
      `).join('');

      return `
    <div class="space-y-8">
        <!-- Stats Row -->
        <div class="flex items-center justify-between">
             <h3 class="text-lg font-bold text-white">${sessionCount} study sessions in ${selectedYear}</h3>
        </div>

        <div class="flex flex-col md:flex-row gap-6 items-start">
             <!-- Graph Container (Left) -->
             <div class="w-full md:flex-1 bg-surface/30 border border-white/5 p-4 rounded-xl overflow-hidden relative">
                  <div class="flex flex-col min-w-[700px] md:min-w-0 overflow-x-auto custom-scrollbar pb-2">
                      <!-- Month Labels Row -->
                      <div class="flex text-xs text-slate-400 mb-2 pl-8" id="month-labels">
                         <!-- JS will populate -->
                      </div>
                      
                      <div class="flex gap-2">
                           <!-- Day Labels Col -->
                           <div class="flex flex-col gap-[3px] text-[10px] text-slate-500 pt-[0px]" id="day-labels">
                                <div class="h-[10px]"></div> <!-- Spacer to align with cells-->
                                <div class="h-[10px] leading-[10px]">Mon</div>
                                <div class="h-[10px]"></div>
                                <div class="h-[10px] leading-[10px]">Wed</div>
                                <div class="h-[10px]"></div>
                                <div class="h-[10px] leading-[10px]">Fri</div>
                                <div class="h-[10px]"></div>
                           </div>

                           <!-- The Grid -->
                           <div class="flex gap-[3px]" id="github-grid">
                                <!-- JS Populated -->
                           </div>
                      </div>

                      <!-- Legend -->
                      <div class="flex items-center justify-end gap-2 text-xs text-slate-400 mt-4 overflow-x-auto whitespace-nowrap">
                           <span>Less</span>
                           <div class="flex gap-[3px] shrink-0">
                                <div class="w-[10px] h-[10px] rounded-[2px] bg-[#161b22]"></div>
                                <div class="w-[10px] h-[10px] rounded-[2px] bg-[#0e4429]"></div>
                                <div class="w-[10px] h-[10px] rounded-[2px] bg-[#006d32]"></div>
                                <div class="w-[10px] h-[10px] rounded-[2px] bg-[#26a641]"></div>
                                <div class="w-[10px] h-[10px] rounded-[2px] bg-[#39d353]"></div>
                           </div>
                           <span>More</span>
                      </div>
                  </div>
             </div>

             <!-- Year Selector (Right on MD+, Bottom on Mobile) -->
             <div class="w-full md:w-auto flex flex-row md:flex-col gap-2 overflow-x-auto custom-scrollbar pb-2 shrink-0 px-1" id="year-selector">
                 ${yearButtons}
             </div>
        </div>

        <!-- Line Chart Container -->
        <div class="bg-surface/50 backdrop-blur-xl border border-white/5 p-6 rounded-3xl shadow-xl">
             <div class="flex items-center justify-between mb-6">
                 <h3 class="text-lg font-bold text-white flex items-center gap-2">
                    <span class="material-icons-outlined text-primary">show_chart</span>
                    Activity Overview
                 </h3>
                 <select id="graph-period" class="bg-slate-900/50 border border-slate-700/50 rounded-lg text-xs text-slate-400 p-2 outline-none">
                    <option value="7">Last 7 Days</option>
                    <option value="30">Last 30 Days</option>
                 </select>
             </div>
             <div class="relative h-64 w-full">
                <canvas id="activityChart"></canvas>
             </div>
        </div>
    </div>
    `;
}

export function initGraphLogic(db) {
      if (!db) return;
      renderGithubGrid(db);
      renderLineChart(db);

      const grid = document.getElementById('github-grid');
      if (grid) {
            grid.addEventListener('click', (e) => {
                  const cell = e.target.closest('.day-cell');
                  if (cell && cell.dataset.date) {
                        showDailyDetails(db, cell.dataset.date);
                  }
            });
      }

      // Year Selector Logic
      const yearSelector = document.getElementById('year-selector');
      if (yearSelector) {
            yearSelector.addEventListener('click', (e) => {
                  const btn = e.target.closest('.year-btn');
                  if (btn) {
                        selectedYear = parseInt(btn.dataset.year);

                        // Re-render whole component to update labels and buttons
                        const container = document.getElementById('activity-graph-container');
                        if (container) {
                              container.innerHTML = renderActivityGraph(db);
                              initGraphLogic(db);
                        } else {
                              // Fallback: just update grid if container not found
                              renderGithubGrid(db);
                        }
                  }
            });
      }
}

function getSessionData() {
      const db = getDB();
      return db.sessions || []; // [{ timestamp, duration }]
}

function showDailyDetails(db, dateStr) {
      const subjects = db.subjects || [];
      const sessions = (db.sessions || []).filter(s => {
            const dStr = new Date(s.timestamp).toISOString().split('T')[0];
            return dStr === dateStr;
      });

      const renderList = (sortMethod) => {
            let sortedSessions = [...sessions];
            if (sortMethod === 'duration') {
                  sortedSessions.sort((a, b) => b.duration - a.duration);
            } else if (sortMethod === 'subject') {
                  sortedSessions.sort((a, b) => {
                        const subA = subjects.find(s => s.id === a.subject_id)?.name || '';
                        const subB = subjects.find(s => s.id === b.subject_id)?.name || '';
                        return subA.localeCompare(subB);
                  });
            }
            // Default time sort (newest first)
            else {
                  sortedSessions.sort((a, b) => b.timestamp - a.timestamp);
            }

            if (sortedSessions.length === 0) {
                  return `<div class="text-slate-400 text-center py-8">No study sessions recorded for this day.</div>`;
            }

            return `
            <div class="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                ${sortedSessions.map(s => {
                  const sub = subjects.find(sub => sub.id === s.subject_id) || { name: 'Unknown Subject', color: '#64748b', topics: [] };
                  const mins = Math.round(s.duration / 60);
                  const timeStr = new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  // Priority: Specific Topic -> All Topics -> General
                  let topicDisplay = 'General Study';
                  if (s.topic_id && sub.topics) {
                        const t = sub.topics.find(t => t.id === s.topic_id);
                        if (t) topicDisplay = t.name;
                  } else if (sub.topics && sub.topics.length > 0) {
                        topicDisplay = sub.topics.map(t => t.name).join(', ');
                  }

                  return `
                    <div class="bg-slate-800/50 border border-white/5 p-4 rounded-xl flex items-center justify-between group hover:bg-slate-800 transition-colors">
                        <div class="flex items-center gap-4">
                            <div class="w-3 h-12 rounded-full" style="background-color: ${sub.color}"></div>
                            <div>
                                <div class="flex items-center gap-2">
                                    <h4 class="font-bold text-white">${sub.name}</h4>
                                    <span class="text-xs text-slate-500 font-mono">${timeStr}</span>
                                </div>
                                <div class="text-xs text-slate-400 mt-1 line-clamp-1">
                                    ${topicDisplay}
                                </div>
                            </div>
                        </div>
                        <div class="text-right">
                             <div class="font-mono font-bold text-lg text-slate-200">${mins}m</div>
                             <div class="text-[10px] text-slate-500 uppercase tracking-wider">Duration</div>
                        </div>
                    </div>
                    `;
            }).join('')}
            </div>
        `;
      };

      openModal(`
        <div class="bg-surface border border-white/10 p-6 rounded-3xl shadow-2xl w-full max-w-lg">
             <div class="flex items-center justify-between mb-6">
                 <div>
                     <h3 class="text-xl font-bold text-white mb-1">Activity Log</h3>
                     <p class="text-sm text-slate-400 font-mono">${new Date(dateStr).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                 </div>
                 <button id="btn-close-modal" class="text-slate-400 hover:text-white transition-colors">
                    <span class="material-icons-outlined">close</span>
                 </button>
             </div>
             
             <div class="flex gap-2 mb-4 pb-4 border-b border-white/5">
                 <span class="text-xs font-bold text-slate-500 uppercase tracking-wider py-2">Sort by:</span>
                 <button class="nav-sort px-3 py-1 rounded-lg text-xs font-medium bg-slate-700/50 hover:bg-slate-700 text-slate-300 transition-colors" data-sort="time">Time</button>
                 <button class="nav-sort px-3 py-1 rounded-lg text-xs font-medium bg-slate-700/50 hover:bg-slate-700 text-slate-300 transition-colors" data-sort="duration">Duration</button>
                 <button class="nav-sort px-3 py-1 rounded-lg text-xs font-medium bg-slate-700/50 hover:bg-slate-700 text-slate-300 transition-colors" data-sort="subject">Subject</button>
             </div>

             <div id="modal-list-container">
                ${renderList('time')}
             </div>
        </div>
    `);

      setTimeout(() => {
            document.getElementById('btn-close-modal').addEventListener('click', closeModal);

            const listContainer = document.getElementById('modal-list-container');
            document.querySelectorAll('.nav-sort').forEach(btn => {
                  btn.addEventListener('click', (e) => {
                        const sortType = e.target.dataset.sort;

                        // Active state
                        document.querySelectorAll('.nav-sort').forEach(b => b.classList.remove('bg-primary/20', 'text-primary'));
                        e.target.classList.add('bg-primary/20', 'text-primary');
                        // Remove default bg
                        e.target.classList.remove('bg-slate-700/50', 'text-slate-300');

                        listContainer.innerHTML = renderList(sortType);
                  });
            });

            // Default active
            const defaultBtn = document.querySelector('.nav-sort[data-sort="time"]');
            if (defaultBtn) {
                  defaultBtn.classList.add('bg-primary/20', 'text-primary');
                  defaultBtn.classList.remove('bg-slate-700/50', 'text-slate-300');
            }
      }, 50);
}

function renderGithubGrid(db) {
      const container = document.getElementById('github-grid');
      const monthContainer = document.getElementById('month-labels');
      if (!container || !db) return;

      const sessions = db.sessions || [];
      const map = {};
      sessions.forEach(s => {
            const date = new Date(s.timestamp).toISOString().split('T')[0]; // YYYY-MM-DD
            map[date] = (map[date] || 0) + s.duration;
      });

      const start = startOfYear(new Date(selectedYear, 0, 1));
      const end = endOfYear(new Date(selectedYear, 0, 1));
      const gridStart = startOfWeek(start);
      // To show the full year, we often go to the end of the year
      const dates = eachDayOfInterval({ start: gridStart, end: end });

      let html = '';
      let currentColumnHtml = '<div class="flex flex-col gap-[3px]">';
      let daysInCol = 0;

      dates.forEach((date, i) => {
            const dateStr = format(date, 'yyyy-MM-dd');
            const duration = map[dateStr] || 0;
            const hours = duration / 3600;

            // Color Logic (GitHub Dark Mode Palette)
            let bgColor = 'bg-[#161b22] border border-white/5';
            if (hours > 0) bgColor = 'bg-[#0e4429] border-transparent';
            if (hours > 1) bgColor = 'bg-[#006d32] border-transparent';
            if (hours > 3) bgColor = 'bg-[#26a641] border-transparent';
            if (hours > 5) bgColor = 'bg-[#39d353] border-transparent';

            const tooltip = `${format(date, 'MMM d, yyyy')}: ${Math.round(hours * 10) / 10} hrs`;

            currentColumnHtml += `<div class="day-cell w-[10px] h-[10px] rounded-[2px] ${bgColor} transition-colors cursor-pointer hover:ring-1 hover:ring-white/50" title="${tooltip}" data-date="${dateStr}"></div>`;
            daysInCol++;

            if (daysInCol === 7) {
                  currentColumnHtml += '</div>';
                  html += currentColumnHtml;
                  currentColumnHtml = '<div class="flex flex-col gap-[3px]">';
                  daysInCol = 0;
            }
      });

      if (daysInCol > 0 && daysInCol < 7) {
            currentColumnHtml += '</div>';
            html += currentColumnHtml;
      }

      container.innerHTML = html;

      let labelRow = '';
      let cM = -1;
      for (let i = 0; i < dates.length; i += 7) {
            const d = dates[i];
            const m = d.getMonth();
            if (m !== cM) {
                  labelRow += `<div class="w-[10px] text-xs overflow-visible text-slate-500">${format(d, 'MMM')}</div><div class="w-[3px]"></div>`;
                  cM = m;
            } else {
                  labelRow += `<div class="w-[10px]"></div><div class="w-[3px]"></div>`;
            }
      }
      monthContainer.innerHTML = labelRow;
}

function renderLineChart(db) {
      const canvas = document.getElementById('activityChart');
      if (!canvas || !db) return;

      if (chartInstance) chartInstance.destroy();

      const select = document.getElementById('graph-period');
      const days = select ? parseInt(select.value) : 7;

      const today = new Date();
      const startDate = subDays(today, days - 1);
      const dateRange = eachDayOfInterval({ start: startDate, end: today });

      const sessions = db.sessions || [];
      const sessionMap = {};
      sessions.forEach(s => {
            const dStr = format(new Date(s.timestamp), 'yyyy-MM-dd');
            sessionMap[dStr] = (sessionMap[dStr] || 0) + s.duration;
      });

      const labels = dateRange.map(d => format(d, days === 7 ? 'EEE' : 'MMM d'));
      const dataPoints = dateRange.map(date => {
            const dStr = format(date, 'yyyy-MM-dd');
            return Math.round(((sessionMap[dStr] || 0) / 3600) * 10) / 10;
      });

      const ctx = canvas.getContext('2d');
      const gradient = ctx.createLinearGradient(0, 0, 0, 400);
      gradient.addColorStop(0, 'rgba(99, 102, 241, 0.4)');
      gradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)');

      chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                  labels: labels,
                  datasets: [{
                        label: 'Study Hours',
                        data: dataPoints,
                        borderColor: '#6366f1',
                        backgroundColor: gradient,
                        borderWidth: 3,
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: '#1e293b',
                        pointBorderColor: '#6366f1',
                        pointRadius: days === 7 ? 4 : 2,
                        pointHoverRadius: 6
                  }]
            },
            options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  interaction: {
                        intersect: false,
                        mode: 'index'
                  },
                  plugins: {
                        legend: { display: false },
                        tooltip: {
                              callbacks: {
                                    label: (ctx) => ` ${ctx.raw} hours`
                              },
                              backgroundColor: 'rgba(15, 23, 42, 0.9)',
                              titleColor: '#94a3b8',
                              bodyColor: '#f8fafc',
                              padding: 12,
                              cornerRadius: 12,
                              displayColors: false
                        }
                  },
                  scales: {
                        y: {
                              beginAtZero: true,
                              grid: { color: 'rgba(255, 255, 255, 0.03)' },
                              ticks: {
                                    color: '#64748b',
                                    padding: 10,
                                    callback: (val) => val + 'h'
                              }
                        },
                        x: {
                              grid: { display: false },
                              ticks: {
                                    color: '#64748b',
                                    padding: 10,
                                    maxRotation: 0,
                                    autoSkip: true,
                                    maxTicksLimit: days === 7 ? 7 : 10
                              }
                        }
                  }
            }
      });

      if (select) {
            select.onchange = () => renderLineChart(db);
      }
}

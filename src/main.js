import './style.css';
import { renderSidebar } from './components/Sidebar.js';
import { renderDashboard, initDashboardLogic } from './components/Dashboard.js';
import { renderTimer, initTimerLogic } from './components/Timer.js';
import { renderSubjects, initSubjectsLogic } from './components/Subjects.js';

import { supabase, getDB } from './utils/storage.js';

const sidebarContainer = document.querySelector('#sidebar');
const mainContent = document.querySelector('#main-content');

// State
let currentView = 'dashboard';
let isSidebarCollapsed = false;

// Router - Updated to handle async components or pass data
const routes = {
      dashboard: { render: renderDashboard, init: initDashboardLogic },
      timer: { render: renderTimer, init: initTimerLogic },
      subjects: { render: renderSubjects, init: initSubjectsLogic },
};


let isLoginMode = true;

async function renderAuth(errorMessage = null) {
      sidebarContainer.classList.add('hidden');
      const container = document.querySelector('#view-container');
      if (!container) return;

      const renderForm = () => {
            container.innerHTML = `
                  <div class="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 animate-fade-in">
                        <h2 class="font-extrabold mb-4">
                              <span class="text-primary flex text-center items-center text-4xl font-black">StudyG
                                    <span class="material-symbols-outlined text-3xl">motion_play</span>
                              </span>
                        </h2>
                        <p class="text-slate-400 mb-8 max-w-md">Your aesthetic study companion.</p>
                        
                        <div class="bg-surface border border-white/10 p-8 rounded-3xl shadow-2xl w-full max-w-sm">
                              <h3 class="text-xl font-bold text-white mb-6 text-left">${isLoginMode ? 'Welcome Back' : 'Join the Grind'}</h3>
                              
                              ${errorMessage ? `<div class="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl mb-4 text-sm text-left">${errorMessage}</div>` : ''}
                              
                              ${!isLoginMode ? `
                                    <div class="space-y-1 mb-4">
                                          <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] text-left ml-1">Username</label>
                                          <input type="text" id="auth-username" placeholder="TopStudent" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-primary/50 transition-colors">
                                    </div>
                              ` : ''}

                              <div class="space-y-1 mb-4">
                                    <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] text-left ml-1">Email Address</label>
                                    <input type="email" id="auth-email" placeholder="alex@gmail.com" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-primary/50 transition-colors">
                              </div>

                              <div class="space-y-1 mb-6">
                                    <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] text-left ml-1">Password</label>
                                    <input type="password" id="auth-password" placeholder="••••••••" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-primary/50 transition-colors">
                              </div>

                              <button id="btn-auth-submit" class="w-full bg-primary hover:bg-indigo-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]">
                                    ${isLoginMode ? 'Sign In' : 'Start Your Journey'}
                              </button>

                              <p id="auth-error" class="text-red-400 text-xs mt-4 hidden text-left"></p>

                              <div class="mt-8 pt-6 border-t border-white/5">
                                    <p class="text-slate-500 text-sm">
                                          ${isLoginMode ? "Don't have an account?" : "Already a member?"} 
                                          <button id="btn-toggle-mode" class="text-primary hover:text-indigo-400 font-bold ml-1 hover:underline transition-colors">
                                                ${isLoginMode ? 'Sign Up' : 'Log In'}
                                          </button>
                                    </p>
                              </div>
                        </div>
                  </div>
            `;
            attachAuthEvents();
      };

      const attachAuthEvents = () => {
            document.getElementById('btn-toggle-mode')?.addEventListener('click', () => {
                  isLoginMode = !isLoginMode;
                  renderForm();
            });

            document.getElementById('btn-auth-submit')?.addEventListener('click', async () => {
                  const errorEl = document.getElementById('auth-error');
                  const btnSubmit = document.getElementById('btn-auth-submit');
                  const originalText = btnSubmit.innerText;

                  errorEl.classList.add('hidden');

                  const email = document.getElementById('auth-email').value;
                  const password = document.getElementById('auth-password').value;

                  if (!email || !password) {
                        errorEl.innerText = "Please fill in all fields.";
                        errorEl.classList.remove('hidden');
                        return;
                  }

                  // Loading State
                  btnSubmit.disabled = true;
                  btnSubmit.innerText = "Processing...";

                  try {
                        if (isLoginMode) {
                              const { error } = await supabase.auth.signInWithPassword({ email, password });
                              if (error) throw error;
                              location.reload();
                        } else {
                              const username = document.getElementById('auth-username').value;
                              if (!username) {
                                    errorEl.innerText = "Username is required!";
                                    errorEl.classList.remove('hidden');
                                    btnSubmit.disabled = false;
                                    btnSubmit.innerText = originalText;
                                    return;
                              }

                              const { error } = await supabase.auth.signUp({
                                    email,
                                    password,
                                    options: {
                                          emailRedirectTo: window.location.origin,
                                          data: { username }
                                    }
                              });

                              if (error) throw error;

                              // Success State
                              container.innerHTML = `
                                    <div class="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 animate-fade-in">
                                          <div class="w-20 h-20 bg-primary/20 text-primary rounded-full flex items-center justify-center mb-6">
                                                <span class="material-icons-outlined text-4xl">mark_email_read</span>
                                          </div>
                                          <h2 class="text-3xl font-bold text-white mb-4">Check your inbox!</h2>
                                          <p class="text-slate-400 mb-8 max-w-sm leading-relaxed">We've sent a verification link to <span class="text-white font-medium">${email}</span>. Click it to activate your account and start studying.</p>
                                          <button onclick="location.reload()" class="bg-white/5 hover:bg-white/10 text-white px-6 py-3 rounded-xl font-bold transition-all border border-white/10">
                                                Back to Login
                                          </button>
                                    </div>
                              `;
                        }
                  } catch (err) {
                        errorEl.innerText = err.message;
                        errorEl.classList.remove('hidden');
                        btnSubmit.disabled = false;
                        btnSubmit.innerText = originalText;
                  }
            });
      };

      renderForm();
}

async function navigate(viewId) {
      if (!routes[viewId]) return;

      const isAuthenticated = await checkAuth();
      if (!isAuthenticated) return;

      currentView = viewId;
      sidebarContainer.classList.remove('hidden');

      // Update Sidebar Width classes
      if (isSidebarCollapsed) {
            sidebarContainer.classList.remove('md:w-64');
            sidebarContainer.classList.add('md:w-20');
      } else {
            sidebarContainer.classList.remove('md:w-20');
            sidebarContainer.classList.add('md:w-64');
      }

      // Update Sidebar Render
      sidebarContainer.innerHTML = renderSidebar(currentView, isSidebarCollapsed);
      attachSidebarEvents();

      // Update Main Content
      mainContent.style.opacity = '0';
      mainContent.style.transform = 'translateY(10px)';

      // Fetch DB for current view
      const db = await getDB();

      const container = document.querySelector('#view-container');
      container.innerHTML = routes[viewId].render(db);
      routes[viewId].init(db);

      // Transition In
      requestAnimationFrame(() => {
            mainContent.style.transition = 'all 0.1s ease-out';
            mainContent.style.opacity = '1';
            mainContent.style.transform = 'translateY(0)';
      });

}

function attachSidebarEvents() {
      // Toggle Sidebar
      const btnToggle = document.getElementById('btn-toggle-sidebar');
      if (btnToggle) {
            btnToggle.addEventListener('click', () => {
                  isSidebarCollapsed = !isSidebarCollapsed;
                  navigate(currentView); // Re-render sidebar
            });
      }

      // Settings
      const btnSettings = document.getElementById('btn-settings');
      if (btnSettings) {
            btnSettings.addEventListener('click', () => {
                  alert("Global settings coming soon! Edit Weekly Goal on Dashboard.");
            });
      }

      // Nav Buttons
      document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                  const target = e.target.closest('.nav-btn');
                  if (target) {
                        const view = target.dataset.view;
                        if (view && view !== currentView) navigate(view);
                  }
            });
      });
}

// Global Refresh Event
document.addEventListener('nav-refresh', () => {
      navigate(currentView);
});

// Navigation Locking
document.addEventListener('toggle-nav', (e) => {
      const locked = e.detail && e.detail.locked;
      const navBtns = document.querySelectorAll('.nav-btn');
      const toggleBtn = document.getElementById('btn-toggle-sidebar');

      // Disable main nav
      navBtns.forEach(btn => {
            if (locked) {
                  btn.classList.add('pointer-events-none', 'opacity-50', 'cursor-not-allowed');
            } else {
                  btn.classList.remove('pointer-events-none', 'opacity-50', 'cursor-not-allowed');
            }
      });

      // Disable Toggle while locked
      if (toggleBtn) {
            if (locked) {
                  toggleBtn.classList.add('pointer-events-none', 'opacity-50', 'cursor-not-allowed');
            } else {
                  toggleBtn.classList.remove('pointer-events-none', 'opacity-50', 'cursor-not-allowed');
            }
      }
});

async function checkAuth() {
      try {
            if (!supabase) throw new Error("Supabase client not initialized. Check your environment variables.");
            const { data: { user }, error } = await supabase.auth.getUser();
            console.log('Auth Check:', { user, error });
            if (error || !user) {
                  await renderAuth();
                  return false;
            }
            return true;
      } catch (e) {
            console.error('Auth error catch:', e);
            await renderAuth(e.message);
            return false;
      }
}


// Init
console.log('App Initializing...');
try {
      mainContent.style.opacity = '1';
      checkAuth().then(isAuthenticated => {
            console.log('Is Authenticated?', isAuthenticated);
            if (isAuthenticated) {
                  sidebarContainer.classList.remove('hidden');
                  navigate('dashboard').catch(err => {
                        console.error('Initial navigation failed:', err);
                        mainContent.innerHTML = `<div class="p-8 text-red-500">Navigation Error: ${err.message}</div>`;
                  });
            }
      }).catch(err => {
            console.error('Init Error in checkAuth:', err);
            mainContent.innerHTML = `<div class="p-8 text-red-500">Initialization Error: ${err.message}</div>`;
      });
} catch (globalErr) {
      console.error('Global Init Error:', globalErr);
      if (mainContent) {
            mainContent.innerHTML = `<div class="p-8 text-red-500">Global Error: ${globalErr.message}</div>`;
      }
}

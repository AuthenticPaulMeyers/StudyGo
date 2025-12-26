import './style.css';
import { renderSidebar } from './components/Sidebar.js';
import { renderDashboard, initDashboardLogic } from './components/Dashboard.js';
import { renderTimer, initTimerLogic } from './components/Timer.js';
import { renderSubjects, initSubjectsLogic } from './components/Subjects.js';

const sidebarContainer = document.querySelector('#sidebar');
const mainContent = document.querySelector('#view-container');

// State
let currentView = 'dashboard';
let isSidebarCollapsed = false;

// Router
const routes = {
      dashboard: { render: renderDashboard, init: initDashboardLogic },
      timer: { render: renderTimer, init: initTimerLogic },
      subjects: { render: renderSubjects, init: initSubjectsLogic },
};

function navigate(viewId) {
      if (!routes[viewId]) return;
      currentView = viewId;

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

      setTimeout(() => {
            mainContent.innerHTML = routes[viewId].render();
            routes[viewId].init();

            // Transition In
            requestAnimationFrame(() => {
                  mainContent.style.transition = 'all 0.3s ease-out';
                  mainContent.style.opacity = '1';
                  mainContent.style.transform = 'translateY(0)';
            });
      }, 200);
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

// Init
mainContent.style.opacity = '0';
setTimeout(() => {
      sidebarContainer.classList.remove('hidden');
      navigate('dashboard');
}, 500);

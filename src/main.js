import './style.css';
import { renderSidebar } from './components/Sidebar.js';
import { renderDashboard, initDashboardLogic } from './components/Dashboard.js';
import { renderTimer, initTimerLogic } from './components/Timer.js';
import { renderSubjects, initSubjectsLogic } from './components/Subjects.js';

const sidebarContainer = document.querySelector('#sidebar');
const mainContent = document.querySelector('#view-container');

// State
let currentView = 'dashboard';

// Router
const routes = {
      dashboard: { render: renderDashboard, init: initDashboardLogic },
      timer: { render: renderTimer, init: initTimerLogic },
      subjects: { render: renderSubjects, init: initSubjectsLogic },
};

function navigate(viewId) {
      if (!routes[viewId]) return;
      currentView = viewId;

      // Update Sidebar
      sidebarContainer.innerHTML = renderSidebar(currentView);
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

// Init
mainContent.style.opacity = '0';
setTimeout(() => {
      sidebarContainer.classList.remove('hidden');
      sidebarContainer.innerHTML = renderSidebar(currentView);
      attachSidebarEvents();
      navigate('dashboard');
}, 500);

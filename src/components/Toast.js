/**
 * Aesthetic Toast Notification System
 */

export function showToast(message, type = 'info') {
      // Create container if it doesn't exist
      let container = document.getElementById('toast-container');
      if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none';
            document.body.appendChild(container);
      }

      const toast = document.createElement('div');
      toast.className = `
        toast-item pointer-events-auto flex items-center gap-3 px-5 py-4 rounded-2xl 
        bg-surface/80 backdrop-blur-xl border border-white/10 shadow-2xl 
        min-w-[300px] max-w-md animate-toast-in
    `;

      const icon = type === 'success' ? 'check_circle' : (type === 'error' ? 'error' : 'info');
      const iconColor = type === 'success' ? 'text-emerald-400' : (type === 'error' ? 'text-red-400' : 'text-primary');

      toast.innerHTML = `
        <span class="material-icons-outlined ${iconColor}">${icon}</span>
        <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-white break-words">${message}</p>
        </div>
        <button class="text-slate-500 hover:text-white transition-colors ml-2">
            <span class="material-icons-outlined text-sm">close</span>
        </button>
    `;

      // Handle close button
      toast.querySelector('button').onclick = () => removeToast(toast);

      container.appendChild(toast);

      // Auto-remove after 5 seconds
      setTimeout(() => removeToast(toast), 5000);
}

function removeToast(toast) {
      if (toast.classList.contains('animate-toast-out')) return;
      toast.classList.add('animate-toast-out');
      toast.addEventListener('animationend', () => toast.remove());
}

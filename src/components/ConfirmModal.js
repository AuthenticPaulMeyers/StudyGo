/**
 * Premium Custom Confirmation Modal
 */

export function showConfirm(message, title = 'Are you sure?') {
      return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 z-[10000] flex items-center justify-center p-4 animate-fade-in';

            // Backdrop
            const backdrop = document.createElement('div');
            backdrop.className = 'absolute inset-0 bg-black/60 backdrop-blur-md';
            modal.appendChild(backdrop);

            // Modal Content
            const content = document.createElement('div');
            content.className = 'relative bg-surface border border-white/10 rounded-3xl shadow-2xl p-8 max-w-sm w-full animate-slide-up';

            content.innerHTML = `
            <div class="flex items-center gap-4 mb-6">
                <div class="w-12 h-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                    <span class="material-icons-outlined text-3xl">help_outline</span>
                </div>
                <div>
                    <h3 class="text-xl font-bold text-white">${title}</h3>
                    <p class="text-slate-400 text-sm mt-1 leading-relaxed">${message}</p>
                </div>
            </div>
            
            <div class="flex gap-3">
                <button id="confirm-cancel" class="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl transition-all border border-white/10">
                    Cancel
                </button>
                <button id="confirm-yes" class="flex-1 bg-primary hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-primary/20">
                    Confirm
                </button>
            </div>
        `;

            modal.appendChild(content);
            document.body.appendChild(modal);

            // Handlers
            const close = (result) => {
                  content.classList.replace('animate-slide-up', 'animate-toast-out');
                  modal.classList.replace('animate-fade-in', 'animate-toast-out');
                  setTimeout(() => {
                        modal.remove();
                        resolve(result);
                  }, 200);
            };

            document.getElementById('confirm-cancel').onclick = () => close(false);
            document.getElementById('confirm-yes').onclick = () => close(true);
            backdrop.onclick = () => close(false);
      });
}

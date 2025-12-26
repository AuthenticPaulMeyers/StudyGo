export function openModal(contentHtml) {
      const container = document.getElementById('modal-container');
      container.innerHTML = `
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity opacity-0" id="modal-backdrop"></div>
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg p-4 transition-all opacity-0 scale-95 origin-center" id="modal-content">
             ${contentHtml}
        </div>
    `;
      container.classList.remove('hidden');
      container.classList.remove('pointer-events-none');

      // Animate in
      requestAnimationFrame(() => {
            container.querySelector('#modal-backdrop').classList.remove('opacity-0');
            const content = container.querySelector('#modal-content');
            content.classList.remove('opacity-0', 'scale-95');
      });

      // Close on backdrop
      container.querySelector('#modal-backdrop').addEventListener('click', closeModal);
}

export function closeModal() {
      const container = document.getElementById('modal-container');
      const backdrop = container.querySelector('#modal-backdrop');
      const content = container.querySelector('#modal-content');

      if (!backdrop) return;

      backdrop.classList.add('opacity-0');
      content.classList.add('opacity-0', 'scale-95');

      setTimeout(() => {
            container.classList.add('hidden');
            container.classList.add('pointer-events-none');
            container.innerHTML = '';
      }, 300);
}

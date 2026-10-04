export function esc(s) {
  return String(s ?? "").replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

export function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none px-4 w-full max-w-md';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `p-3 rounded-xl shadow-lg text-sm font-medium text-white pointer-events-auto transition-all duration-300 ${type === 'error' ? 'bg-red-600' : 'bg-slate-900'} opacity-0 translate-y-2`;
  toast.textContent = message;
  container.appendChild(toast);
  requestAnimationFrame(() => {
    toast.classList.remove('opacity-0', 'translate-y-2');
  });
  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

export function setConnStatus(isOnline) {
  const badge = document.getElementById('connStatus');
  if (!badge) return;
  if (isOnline) {
    badge.className = "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200";
    badge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span><span>Online</span>`;
  } else {
    badge.className = "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200";
    badge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span><span>Offline</span>`;
  }
}
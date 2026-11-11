// Non-blocking message that replaces window.alert. Announced to screen readers.
let host

export function notify(message, { error = false } = {}) {
  if (typeof document === 'undefined') return
  if (!host) {
    host = document.createElement('div')
    host.setAttribute('role', 'status')
    host.setAttribute('aria-live', 'polite')
    host.className = 'fixed inset-x-4 bottom-24 z-[100] mx-auto flex max-w-md flex-col gap-2 md:bottom-6'
    document.body.appendChild(host)
  }
  const item = document.createElement('div')
  item.textContent = message
  item.className = `rounded-2xl px-5 py-4 text-base font-bold text-white ${error ? 'bg-rose-600' : 'bg-sage-900'}`
  host.appendChild(item)
  setTimeout(() => item.remove(), 5000)
}

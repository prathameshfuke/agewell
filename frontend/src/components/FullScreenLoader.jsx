import logo from '/logo.png'

export default function FullScreenLoader({ message = 'Loading AgeWell…' }) {
  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center px-6" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-4 text-center">
        <img src={logo} alt="" className="w-14 h-14 object-contain" />
        <p className="text-sage-700 text-lg">{message}</p>
        <div className="loading-spinner motion-reduce:animate-none" aria-hidden="true" />
      </div>
    </div>
  )
}

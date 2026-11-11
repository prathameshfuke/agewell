import * as legacy from '../../assets/images'

// Generated transparent illustrations live in assets/images/gen (optional; absent until generated).
// Missing names fall back to the older JPEG stickers, which need the multiply blend on paper.
const gen = Object.values(import.meta.glob('../../assets/images/gen/index.js', { eager: true }))[0] || {}

const FALLBACK = {
  morning: [legacy.danceSticker, 287, 340],
  pills: [legacy.cheerSticker, 309, 340],
  heart: [legacy.fineSticker, 340, 340],
  call: [legacy.chatSticker, 472, 340],
  shield: [legacy.dogSticker, 736, 601],
  voice: [legacy.chatSticker, 472, 340],
  together: [legacy.couplePhoto, 1024, 1210],
  done: [legacy.bowSticker, 459, 340],
  family: [legacy.familyPhoto, 1536, 1024],
  rest: [legacy.sleepSticker, 337, 340],
}

/** Illustration by name. Size it with height utilities; it keeps its natural proportions. */
export default function Art({ name, className = 'h-28', eager = false }) {
  const [fallback, w, h] = FALLBACK[name] || FALLBACK.rest
  const src = gen[name]
  return (
    <img
      src={src || fallback}
      alt=""
      width={src ? (name === 'together' || name === 'family' ? 480 : 400) : w}
      height={src ? 400 : h}
      loading={eager ? 'eager' : 'lazy'}
      className={`${src ? '' : 'sticker'} w-auto max-w-full object-contain ${className}`}
    />
  )
}

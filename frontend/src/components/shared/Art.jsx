import * as gen from '../../assets/images/gen'

// name -> [svg, viewBox width, height]. `rest` is the sleeping grandparent.
const ART = {
  morning: [gen.morning, 400, 400],
  pills: [gen.pills, 400, 400],
  heart: [gen.heart, 400, 400],
  call: [gen.call, 400, 400],
  shield: [gen.shield, 400, 400],
  voice: [gen.voice, 400, 400],
  together: [gen.together, 480, 400],
  done: [gen.done, 400, 400],
  family: [gen.family, 480, 400],
  rest: [gen.moodSleep, 400, 400],
}

/** Illustration by name. Size it with height utilities; it keeps its natural proportions. */
export default function Art({ name, className = 'h-28', eager = false }) {
  const [src, w, h] = ART[name] || ART.rest
  return (
    <img src={src} alt="" width={w} height={h} loading={eager ? 'eager' : 'lazy'} className={`w-auto max-w-full object-contain ${className}`} />
  )
}

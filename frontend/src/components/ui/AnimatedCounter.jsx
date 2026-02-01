import { useEffect, useState } from 'react'

export default function AnimatedCounter({ 
  value, 
  duration = 1000,
  className = '',
  suffix = '',
  prefix = '' 
}) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let startTime
    let animationFrame

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      
      const easeOutQuad = (t) => t * (2 - t)
      const currentCount = Math.floor(easeOutQuad(progress) * value)
      
      setCount(currentCount)

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [value, duration])

  return (
    <span className={className}>
      {prefix}{count}{suffix}
    </span>
  )
}

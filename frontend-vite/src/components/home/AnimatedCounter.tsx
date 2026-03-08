/**
 * Animated Counter Component
 * Location: src/components/home/AnimatedCounter.tsx
 *
 * Animates numbers counting up from 0 to target value
 */

import { useEffect, useRef, useState } from 'react'

interface AnimatedCounterProps {
  value: number
  duration?: number
  className?: string
}

export function AnimatedCounter({ value, duration = 2000, className = '' }: AnimatedCounterProps) {
  const [count, setCount] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const countRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    if (countRef.current) {
      observer.observe(countRef.current)
    }

    return () => {
      if (countRef.current) {
        observer.unobserve(countRef.current)
      }
    }
  }, [isVisible])

  useEffect(() => {
    if (!isVisible) return

    const startTime = Date.now()
    const endValue = value

    const animateCount = () => {
      const now = Date.now()
      const progress = Math.min((now - startTime) / duration, 1)

      // Easing function for smooth animation
      const easeOutQuad = (t: number) => t * (2 - t)
      const easedProgress = easeOutQuad(progress)

      const currentCount = Math.floor(easedProgress * endValue)
      setCount(currentCount)

      if (progress < 1) {
        requestAnimationFrame(animateCount)
      } else {
        setCount(endValue)
      }
    }

    requestAnimationFrame(animateCount)
  }, [isVisible, value, duration])

  return (
    <div ref={countRef} className={className} role="text">
      {count.toLocaleString()}
    </div>
  )
}

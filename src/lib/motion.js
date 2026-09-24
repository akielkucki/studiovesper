import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger, SplitText)

export { gsap, ScrollTrigger, SplitText }

const reducedQuery = typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null

export const prefersReducedMotion = () => !!reducedQuery?.matches

export const isDesktop = () => window.matchMedia('(min-width: 1024px)').matches

/** Resolves when web fonts are ready, or after `timeout` ms — whichever comes first. */
export function waitForFonts(timeout = 1500) {
  if (!document.fonts?.ready) return Promise.resolve()
  return Promise.race([document.fonts.ready, new Promise((resolve) => setTimeout(resolve, timeout))])
}

let lenis = null

/** Smooth wheel scrolling driven by the GSAP ticker. Skipped for reduced motion. */
export function initSmoothScroll() {
  if (prefersReducedMotion()) return () => {}

  lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.95 })
  lenis.on('scroll', ScrollTrigger.update)
  const raf = (time) => lenis.raf(time * 1000)
  gsap.ticker.add(raf)
  gsap.ticker.lagSmoothing(0)

  return () => {
    gsap.ticker.remove(raf)
    lenis.destroy()
    lenis = null
  }
}

const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4)

/** Scrolls to a section and moves keyboard focus there once it arrives. */
export function scrollToElement(target) {
  const offset = isDesktop() ? 0 : -parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--bar') || 0)
  const settle = () => {
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1')
    target.focus({ preventScroll: true })
  }

  if (lenis) {
    lenis.scrollTo(target, { offset, duration: 1.6, easing: easeOutQuart, onComplete: settle })
    return
  }
  const top = target.getBoundingClientRect().top + window.scrollY + offset
  window.scrollTo({ top, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
  settle()
}

/** Routes every in-page anchor through scrollToElement. */
export function bindAnchorLinks() {
  const onClick = (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return
    const link = event.target.closest?.('a[href^="#"]')
    if (!link) return
    const id = decodeURIComponent(link.getAttribute('href').slice(1))
    const target = id && document.getElementById(id)
    if (!target) return
    event.preventDefault()
    scrollToElement(target)
    history.replaceState(null, '', `#${id}`)
  }
  document.addEventListener('click', onClick)
  return () => document.removeEventListener('click', onClick)
}

import { gsap, SplitText } from './motion.js'

/**
 * Declarative scroll reveals:
 *   data-reveal="lines"  headline lines rise out of masks
 *   data-reveal="words"  words brighten as the reader scrolls through them
 *   data-reveal="fade"   a gentle rise-and-fade
 * Reduced motion leaves everything static and fully visible.
 */
export function initReveals(scope) {
  const mm = gsap.matchMedia()

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    scope.querySelectorAll('[data-reveal="lines"]').forEach((el) => {
      SplitText.create(el, {
        type: 'lines',
        mask: 'lines',
        linesClass: 'line',
        autoSplit: true,
        onSplit: (self) =>
          gsap.from(self.lines, {
            yPercent: 112,
            duration: 1.25,
            ease: 'expo.out',
            stagger: 0.085,
            scrollTrigger: { trigger: el, start: 'top 86%', once: true },
          }),
      })
    })

    scope.querySelectorAll('[data-reveal="words"]').forEach((el) => {
      SplitText.create(el, {
        type: 'words',
        autoSplit: true,
        onSplit: (self) =>
          gsap.fromTo(
            self.words,
            { opacity: 0.16 },
            {
              opacity: 1,
              ease: 'none',
              stagger: 0.1,
              scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 55%', scrub: 0.5 },
            },
          ),
      })
    })

    scope.querySelectorAll('[data-reveal="fade"]').forEach((el) => {
      gsap.from(el, {
        autoAlpha: 0,
        y: 32,
        duration: 1.2,
        ease: 'expo.out',
        delay: parseFloat(el.dataset.revealDelay || 0),
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      })
    })
  })

  return () => mm.revert()
}

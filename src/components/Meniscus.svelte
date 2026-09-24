<script>
  import { onMount } from 'svelte'
  import { gsap, prefersReducedMotion } from '../lib/motion.js'

  // The previous section's surface sags into this one like a meniscus, then settles flat as it arrives.
  let { fill = 'var(--ink)' } = $props()

  let svg
  let path

  const shape = (a) => {
    const c = (133 * a).toFixed(2)
    return `M0 0 L100 0 C75 ${c} 25 ${c} 0 0 Z`
  }

  onMount(() => {
    if (prefersReducedMotion()) {
      path.setAttribute('d', shape(0))
      return
    }
    const state = { a: 1 }
    const draw = () => path.setAttribute('d', shape(state.a))
    draw()
    const tween = gsap.to(state, {
      a: 0,
      ease: 'none',
      onUpdate: draw,
      scrollTrigger: { trigger: svg.parentElement, start: 'top bottom', end: 'top 30%', scrub: 0.6 },
    })
    return () => {
      tween.scrollTrigger?.kill()
      tween.kill()
    }
  })
</script>

<svg
  class="meniscus"
  viewBox="0 0 100 100"
  preserveAspectRatio="none"
  aria-hidden="true"
  style:fill
  bind:this={svg}
>
  <path bind:this={path} d={shape(1)} />
</svg>

<style>
  .meniscus {
    position: absolute;
    top: -1px;
    left: 0;
    width: 100%;
    height: clamp(40px, 6.5vw, 120px);
    max-width: none;
    pointer-events: none;
  }
</style>

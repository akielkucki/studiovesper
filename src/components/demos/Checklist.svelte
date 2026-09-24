<script>
  import { onMount } from 'svelte'
  import { gsap, ScrollTrigger, prefersReducedMotion } from '../../lib/motion.js'

  // What every page is built to do: get the phone to ring.
  const items = [
    'Loads fast on mobile data',
    'Tap-to-call on every page',
    'Reviews above the fold',
    'Quote form in two steps',
    'Local search basics',
  ]

  let root
  let done = $state(items.length)

  onMount(() => {
    if (prefersReducedMotion()) return
    const rows = root.querySelectorAll('.check__row')
    const counter = { n: 0 }
    const tl = gsap.timeline({ paused: true })
    rows.forEach((row, i) => {
      const at = i * 0.24
      tl.from(row.querySelector('.check__box'), { scale: 0, duration: 0.5, ease: 'back.out(2.2)' }, at)
        .from(row.querySelector('.check__tick'), { strokeDashoffset: 16, duration: 0.35, ease: 'power2.out' }, at + 0.18)
        .from(row.querySelector('.check__text'), { autoAlpha: 0.3, x: -6, duration: 0.5, ease: 'expo.out' }, at)
    })
    tl.fromTo(
      counter,
      { n: 0 },
      {
        n: items.length,
        duration: items.length * 0.24,
        ease: `steps(${items.length})`,
        onUpdate: () => (done = Math.round(counter.n)),
      },
      0.2,
    )

    const trigger = ScrollTrigger.create({
      trigger: root,
      start: 'top 78%',
      onEnter: () => tl.restart(),
      onEnterBack: () => tl.restart(),
    })
    return () => {
      trigger.kill()
      tl.kill()
    }
  })
</script>

<figure class="check" bind:this={root}>
  <figcaption class="check__head mono">
    <span>Every site ships with</span>
    <span class="check__count">{done}/{items.length}</span>
  </figcaption>
  <ul class="check__list">
    {#each items as item (item)}
      <li class="check__row">
        <span class="check__box" aria-hidden="true">
          <svg viewBox="0 0 12 12"><path class="check__tick" d="M2.4 6.3 4.9 8.7 9.6 3.6" /></svg>
        </span>
        <span class="check__text">{item}</span>
      </li>
    {/each}
  </ul>
</figure>

<style>
  .check {
    padding: 18px 18px 8px;
    border-radius: 14px;
    border: 1px solid var(--line);
    background: var(--raised);
  }

  .check__head {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding-bottom: 14px;
    border-bottom: 1px solid var(--line);
    color: var(--muted);
  }

  .check__count {
    color: var(--fg);
    font-variant-numeric: tabular-nums;
  }

  .check__row {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 0;
    border-bottom: 1px solid var(--line);
    font-size: clamp(16px, 1.25vw, 19px);
    letter-spacing: -0.012em;
  }

  .check__row:last-child {
    border-bottom: 0;
  }

  .check__box {
    display: grid;
    place-items: center;
    width: 22px;
    height: 22px;
    flex: none;
    background: var(--paper);
    color: var(--ink);
  }

  .check__box svg {
    width: 14px;
    height: 14px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .check__tick {
    stroke-dasharray: 16;
    stroke-dashoffset: 0;
  }
</style>

<script>
  import { onMount } from 'svelte'
  import { gsap, prefersReducedMotion } from '../../lib/motion.js'

  // A client site in miniature: a fictional local roofer, owned outright by the business.
  const tiles = ['Repairs', 'Replacements', 'Inspections']

  let root

  onMount(() => {
    if (prefersReducedMotion()) return
    const tl = gsap.timeline({
      defaults: { ease: 'expo.out', duration: 1 },
      scrollTrigger: { trigger: root, start: 'top 78%', once: true },
    })
    tl.from(root.querySelectorAll('[data-build]'), { autoAlpha: 0, y: 14, stagger: 0.08 })
      .from(root.querySelector('.site__owner-rule'), { scaleX: 0, duration: 1.2 }, '-=0.5')
      .from(root.querySelector('.site__owner-value'), { autoAlpha: 0, x: -10 }, '<0.3')
    return () => {
      tl.scrollTrigger?.kill()
      tl.kill()
    }
  })
</script>

<figure class="site" bind:this={root}>
  <div class="site__window" aria-hidden="true">
    <div class="site__chrome">
      <i></i><i></i><i></i>
      <span class="site__url">oaklineroofing.com</span>
    </div>
    <div class="site__page">
      <div class="site__nav" data-build>
        <span class="site__brand">
          <svg viewBox="0 0 16 12"><path d="M1 7.5 8 1.5l7 6M3.5 6v5h9V6" /></svg>
          Oakline Roofing
        </span>
        <span class="site__links">Services · Reviews · Areas</span>
        <span class="site__call">Call now</span>
      </div>
      <div class="site__hero" data-build>
        <span class="site__kicker">Northside and Eastgate</span>
        <strong>Roof repairs, done right the first time.</strong>
        <span class="site__actions">
          <span class="site__btn">Get a free quote</span>
          <span class="site__phone">(555) 010-2291</span>
        </span>
      </div>
      <div class="site__tiles">
        {#each tiles as tile (tile)}
          <div class="site__tile" data-build><span>{tile}</span><span>→</span></div>
        {/each}
      </div>
    </div>
  </div>
  <figcaption class="site__owner mono">
    <span class="site__owner-key">Site owner</span>
    <span class="site__owner-rule" aria-hidden="true"></span>
    <span class="site__owner-value">You</span>
  </figcaption>
</figure>

<style>
  .site {
    width: 100%;
  }

  .site__window {
    border-radius: 14px;
    overflow: hidden;
    background: var(--paper);
    color: var(--ink);
    box-shadow: 0 40px 80px -40px rgb(0 0 0 / 0.8);
  }

  .site__chrome {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 11px 14px;
    border-bottom: 1px solid rgb(10 10 10 / 0.1);
  }

  .site__chrome i {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    border: 1px solid rgb(10 10 10 / 0.35);
  }

  .site__url {
    margin-left: 10px;
    padding: 3px 10px;
    border-radius: 999px;
    background: rgb(10 10 10 / 0.06);
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--stone);
  }

  .site__page {
    padding: 16px 18px 20px;
  }

  .site__nav {
    display: flex;
    align-items: center;
    gap: 14px;
    font-size: 12px;
  }

  .site__brand {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font-weight: 700;
    letter-spacing: -0.02em;
    white-space: nowrap;
  }

  .site__brand svg {
    width: 16px;
    height: 12px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.6;
    stroke-linejoin: round;
  }

  .site__links {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--stone);
  }

  .site__call {
    margin-left: auto;
    padding: 5px 11px;
    border-radius: 999px;
    background: var(--ink);
    color: var(--paper);
    font-size: 11px;
    font-weight: 600;
    white-space: nowrap;
  }

  .site__hero {
    display: grid;
    gap: 8px;
    margin-top: 16px;
    padding: 20px 18px;
    border-radius: 10px;
    background: var(--ink);
    color: var(--paper);
  }

  .site__kicker {
    font-family: var(--font-mono);
    font-size: 10.5px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--smoke);
  }

  .site__hero strong {
    max-width: 18ch;
    font-size: clamp(18px, 1.6vw, 24px);
    font-weight: 600;
    line-height: 1.02;
    letter-spacing: -0.035em;
  }

  .site__actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
    margin-top: 6px;
  }

  .site__btn {
    padding: 6px 12px;
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font-size: 11.5px;
    font-weight: 600;
  }

  .site__phone {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--smoke);
  }

  .site__tiles {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin-top: 12px;
  }

  .site__tile {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    border-radius: 10px;
    border: 1px solid rgb(10 10 10 / 0.14);
    font-size: 12.5px;
    font-weight: 600;
    letter-spacing: -0.01em;
  }

  .site__owner {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-top: 22px;
  }

  .site__owner-key {
    color: var(--muted);
  }

  .site__owner-rule {
    flex: 1;
    height: 1px;
    background: var(--line);
    transform-origin: left;
  }

  .site__owner-value {
    color: var(--fg);
  }

  @media (max-width: 480px) {
    .site__links {
      display: none;
    }

    .site__tile span:last-child {
      display: none;
    }
  }
</style>

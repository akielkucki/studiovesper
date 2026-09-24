<script>
  import { onMount } from 'svelte'
  import { gsap, prefersReducedMotion } from '../lib/motion.js'

  // An exploded axonometric of the service layers.
  // `spread` (0–1) packs the slabs into one block or pulls them apart, `active` lifts one slab,
  // and `assembled` inks the whole stack once every layer has been shown.
  let { layers = [], active = -1, spread = 1, assembled = false } = $props()

  const A = 124 // half width of a slab's top face
  const B = 62 // half height (2:1 isometric)
  const T = 20 // slab thickness
  const CX = 180
  const GAP_PACKED = T + 5
  const GAP_OPEN = 118
  const MARGIN = 32

  const n = $derived(layers.length)
  const viewHeight = $derived(2 * MARGIN + 2 * B + T + (n - 1) * GAP_OPEN)
  const center = $derived(MARGIN + B + ((n - 1) * GAP_OPEN) / 2)
  const gap = $derived(GAP_PACKED + (GAP_OPEN - GAP_PACKED) * spread)
  const offsetOf = (i) => center + (i - (n - 1) / 2) * gap

  // Local geometry, drawn around each slab's own origin.
  const top = `0,${-B} ${A},0 0,${B} ${-A},0`
  const left = `${-A},0 0,${B} 0,${B + T} ${-A},${T}`
  const right = `0,${B} ${A},0 ${A},${T} 0,${B + T}`
  const label = `matrix(0.894 -0.447 0.894 0.447 0 ${B * 0.34})` // text lying flat on the top face

  const lifts = $state([])
  let mounted = $state(false)
  // No lift while the slabs are packed or assembled, or the lifted one would cut into its neighbour.
  const lifted = $derived(assembled || spread < 0.35 ? -1 : active)

  $effect(() => {
    if (!mounted) return
    const current = lifted
    const duration = prefersReducedMotion() ? 0 : 0.9
    lifts.forEach((g, i) => {
      if (g) gsap.to(g, { y: i === current ? -22 : 0, duration, ease: 'expo.out', overwrite: 'auto' })
    })
  })

  onMount(() => {
    mounted = true
  })
</script>

<svg
  class="stack"
  class:is-assembled={assembled}
  viewBox={`0 0 360 ${viewHeight}`}
  role="img"
  aria-label={`${n} stacked layers: ${layers.join(', ').toLowerCase()}.`}
>
  <defs>
    <pattern id="stack-hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(-30)">
      <line x1="0" y1="0" x2="0" y2="5" />
    </pattern>
  </defs>
  <!-- drawn bottom-up so upper slabs overlap the ones below -->
  {#each [...layers].reverse() as name, r (name)}
    {@const i = n - 1 - r}
    <g transform={`translate(${CX} ${offsetOf(i)})`}>
      <g class="slab" class:is-active={i === active} bind:this={lifts[i]}>
        <polygon class="slab__left" points={left} />
        <polygon class="slab__right" points={right} />
        <polygon class="slab__hatch" points={right} />
        <polygon class="slab__top" points={top} />
        <text class="slab__label" transform={label} text-anchor="middle">{name}</text>
      </g>
    </g>
  {/each}
</svg>

<style>
  .stack {
    width: 100%;
    max-width: 420px;
    height: auto;
    overflow: visible;
  }

  .stack pattern line {
    stroke: var(--ink);
    stroke-width: 0.9;
  }

  .slab polygon {
    stroke: var(--ink);
    stroke-width: 1.2;
    stroke-linejoin: round;
    transition:
      fill 0.6s var(--ease-out),
      stroke 0.6s var(--ease-out);
  }

  .slab__top,
  .slab__left,
  .slab__right {
    fill: var(--paper);
  }

  .slab__hatch {
    fill: url(#stack-hatch);
    transition: opacity 0.6s var(--ease-out);
  }

  .slab__label {
    font-family: var(--font-mono);
    font-size: 11.5px;
    font-weight: 500;
    letter-spacing: 0.12em;
    fill: var(--ink);
    transition: fill 0.6s var(--ease-out);
  }

  .slab.is-active .slab__top,
  .slab.is-active .slab__left,
  .slab.is-active .slab__right,
  .is-assembled .slab__top,
  .is-assembled .slab__left,
  .is-assembled .slab__right {
    fill: var(--ink);
    stroke: var(--paper);
  }

  .slab.is-active .slab__hatch,
  .is-assembled .slab__hatch {
    opacity: 0;
  }

  .slab.is-active .slab__label,
  .is-assembled .slab__label {
    fill: var(--paper);
  }
</style>

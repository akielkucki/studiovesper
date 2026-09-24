<script>
  import { onMount } from 'svelte'
  import { sections } from '../lib/content.js'
  import { ui } from '../lib/state.svelte.js'
  import { gsap, ScrollTrigger, prefersReducedMotion } from '../lib/motion.js'
  import Logo from './Logo.svelte'

  const barSections = sections.slice(1) // the logo stands in for "Intro" on small screens
  const railItems = $state([])
  const barItems = $state([])
  const railLinks = $state([])
  const barLinks = $state([])
  let railList
  let progress
  let barScroller
  let mounted = $state(false)

  // Active label grows and thickens; the variable font interpolates the weight smoothly.
  const railStyle = (on) => {
    const size = Math.round(Math.min(34, Math.max(24, window.innerWidth * 0.0205)))
    return on
            ? { fontSize: size, fontWeight: 720, opacity: 1, letterSpacing: '-0.04em' }
            : { fontSize: 14, fontWeight: 430, opacity: 0.62, letterSpacing: '-0.01em' }
  }

  const barStyle = (on) =>
          on ? { fontSize: 16.5, fontWeight: 700, opacity: 1 } : { fontSize: 13.5, fontWeight: 450, opacity: 0.62 }

  const centerCurrentTab = () => {
    const current = barLinks[barSections.findIndex((s) => s.id === ui.active)]
    if (!current || !barScroller || barScroller.scrollWidth <= barScroller.clientWidth + 1) return
    const currentRect = current.getBoundingClientRect()
    const scrollerRect = barScroller.getBoundingClientRect()
    const left = barScroller.scrollLeft + currentRect.left - scrollerRect.left
            - (barScroller.clientWidth - currentRect.width) / 2
    barScroller.scrollTo({ left, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
  }

  $effect(() => {
    if (!mounted) return
    const active = ui.active
    const duration = prefersReducedMotion() ? 0 : 0.8
    const timeline = gsap.timeline({
      defaults: { duration, ease: 'expo.out', overwrite: 'auto' },
      onComplete: centerCurrentTab,
    })

    // A fixed container and zero flex basis keep inactive boxes equal.
    // Animate layout instead of scale so adjacent boxes yield real space.
    sections.forEach((s, i) => {
      const on = s.id === active
      if (railItems[i]) timeline.to(railItems[i], { flexGrow: on ? 2 : 1 }, 0)
      if (railLinks[i]) timeline.to(railLinks[i], railStyle(on), 0)
    })
    barSections.forEach((s, i) => {
      const on = s.id === active
      if (barItems[i]) timeline.to(barItems[i], { flexGrow: on ? 2 : 1 }, 0)
      if (barLinks[i]) timeline.to(barLinks[i], barStyle(on), 0)
    })

    return () => timeline.kill()
  })

  onMount(() => {
    mounted = true
    const setProgress = gsap.quickSetter(progress, 'scaleY')
    const tracker = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => setProgress(self.progress),
    })

    let intro
    if (!prefersReducedMotion()) {
      intro = gsap.from(railList.children, {
        autoAlpha: 0,
        x: -16,
        duration: 1.1,
        ease: 'expo.out',
        stagger: 0.06,
        delay: 0.6,
      })
    }

    const onResize = () => {
      const i = sections.findIndex((s) => s.id === ui.active)
      if (railLinks[i]) gsap.set(railLinks[i], { fontSize: railStyle(true).fontSize })
      centerCurrentTab()
    }
    window.addEventListener('resize', onResize)

    return () => {
      tracker.kill()
      intro?.kill()
      window.removeEventListener('resize', onResize)
    }
  })
</script>

<!-- Desktop: fixed rail on the left. Blend mode keeps it legible over dark and light sections alike. -->
<header class="rail">
  <a class="rail__brand" href="#intro" aria-label="StudioVesper, back to top">
    <Logo />
  </a>

  <nav class="rail__nav" aria-label="Sections">
    <ol bind:this={railList} style={`--section-count: ${sections.length}`}>
      {#each sections as section, i (section.id)}
        <li bind:this={railItems[i]}>
          <a
                  href={`#${section.id}`}
                  bind:this={railLinks[i]}
                  aria-current={ui.active === section.id ? 'location' : undefined}>{section.label}</a
          >
        </li>
      {/each}
    </ol>
  </nav>

  <span class="rail__track" aria-hidden="true"><span class="rail__progress" bind:this={progress}></span></span>
</header>

<!-- Mobile and tablet: a compact bar along the top with thumb-sized targets. -->
<header class="bar" data-bar-theme={ui.barTheme}>
  <a class="bar__brand" href="#intro" aria-label="StudioVesper, back to top">
    <Logo mark />
  </a>
  <nav class="bar__nav" aria-label="Sections" bind:this={barScroller}>
    <ol style={`--section-count: ${barSections.length}`}>
      {#each barSections as section, i (section.id)}
        <li bind:this={barItems[i]}>
          <a
                  href={`#${section.id}`}
                  bind:this={barLinks[i]}
                  aria-current={ui.active === section.id ? 'location' : undefined}>{section.label}</a
          >
        </li>
      {/each}
    </ol>
  </nav>
</header>

<style>
  .rail {
    display: none;
  }

  @media (min-width: 1024px) {
    .rail {
      display: block;
      position: fixed;
      inset: 0 auto 0 0;
      width: var(--rail);
      z-index: 60;
      color: #fff;
      mix-blend-mode: difference;
      pointer-events: none;
    }

    .rail a {
      pointer-events: auto;
    }

    .rail__brand {
      position: absolute;
      top: 30px;
      left: var(--gutter);
    }

    /* The stack runs from under the logo to the foot of the rail. */
    .rail__nav {
      position: absolute;
      top: 88px;
      bottom: 30px;
      left: var(--gutter);
      right: 12px;
    }

    /* Flex, not grid: every item starts from a zero basis with an equal share (flex-grow: 1),
       and GSAP tweens the active item's flex-grow to 2 so it takes two shares while the rest compress. */
    .rail__nav ol {
      display: flex;
      flex-direction: column;
      height: 100%;
      gap: 4px;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .rail__nav li {
      flex: 1 1 0;
      min-height: 0;
      min-width: 0;
      margin: 0;
      padding: 0;
    }

    .rail__nav a {
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      width: 100%;
      height: 100%;
      padding: 12px 10px;
      border: 1px solid rgb(255 255 255 / 0.3);
      overflow: hidden;
      font-size: 14px;
      font-weight: 430;
      line-height: 1.1;
      letter-spacing: -0.01em;
      opacity: 0.62;
      white-space: nowrap;
      text-decoration: none;
      text-align: center;
      justify-content: center;
      align-items: center;
      transition:
        background-color 0.5s var(--ease-out),
        color 0.5s var(--ease-out);
      /* Top-aligned labels let the active box open downward. */
    }

    .rail__nav a[aria-current='location'] {
      background: rgb(255 255 255);
      color: var(--ink);
      z-index: 40;
    }

    .rail__nav a:focus-visible {
      outline: 2px solid currentColor;
      outline-offset: -4px;
    }

    .rail__nav a:hover {
      opacity: 1 !important;
    }

    .rail__track {
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      width: 1px;
      background: rgb(255 255 255 / 0.2);
    }

    .rail__progress {
      position: absolute;
      inset: 0;
      background: #fff;
      transform: scaleY(0);
      transform-origin: top;
    }
  }

  .bar {
    position: fixed;
    inset: 0 0 auto 0;
    z-index: 60;
    height: var(--bar);
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 0 6px 0 var(--gutter);
    background: rgb(10 10 10 / 0.84);
    color: var(--paper);
    border-bottom: 1px solid rgb(243 243 241 / 0.1);
    -webkit-backdrop-filter: blur(14px) saturate(120%);
    backdrop-filter: blur(14px) saturate(120%);
    transition:
            background-color 0.5s var(--ease-out),
            color 0.5s var(--ease-out),
            border-color 0.5s var(--ease-out);
  }

  .bar[data-bar-theme='light'] {
    background: rgb(243 243 241 / 0.86);
    color: var(--ink);
    border-bottom-color: rgb(10 10 10 / 0.08);
  }

  @media (min-width: 1024px) {
    .bar {
      display: none;
    }
  }

  .bar__brand {
    display: grid;
    place-items: center;
    min-width: 44px;
    min-height: 44px;
    margin-left: -9px;
    flex: none;
  }

  .bar__nav {
    flex: 1;
    min-width: 0;
    overflow-x: auto;
    scrollbar-width: none;
    -webkit-mask-image: linear-gradient(to right, transparent 0, #000 14px, #000 calc(100% - 14px), transparent);
    mask-image: linear-gradient(to right, transparent 0, #000 14px, #000 calc(100% - 14px), transparent);
  }

  .bar__nav::-webkit-scrollbar {
    display: none;
  }

  .bar__nav ol {
    display: flex;
    align-items: stretch;
    box-sizing: border-box;
    width: 100%;
    min-width: calc((var(--section-count) + 1) * 96px);
    gap: 4px;
    margin: 0;
    padding: 0 14px;
    list-style: none;
  }

  .bar__nav li {
    flex: 1 1 0px;
    min-width: 0;
    margin: 0;
    padding: 0;
  }

  .bar__nav a {
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    width: 100%;
    min-height: 44px;
    padding: 0 6px;
    border: 1px solid currentColor;
    overflow: hidden;
    text-decoration: none;
    font-size: 13.5px;
    font-weight: 450;
    letter-spacing: -0.01em;
    opacity: 0.62;
    white-space: nowrap;
  }
  .bar__nav a[aria-current='location'] {
    background: rgb(127 127 127 / 0.12);
  }

  .bar__nav a:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: -4px;
  }
</style>

<script>
  import { onMount } from 'svelte'
  import { gsap, ScrollTrigger, SplitText, prefersReducedMotion, waitForFonts } from '../lib/motion.js'
  import { LiquidSurface } from '../lib/liquid/LiquidSurface.js'
  import { hero as heroCopy } from '../lib/content.js'
  import { taperBreaks } from '../lib/taper.js'

  const ledeWords = heroCopy.lede.flatMap((part) =>
    part.text.split(' ').map((text) => ({ text, strong: !!part.strong })),
  )
  let ledeBreaks = $state([]) // word indices that start a new line on phones

  /** Width of the last rendered line of text inside `el`, measured from its text fragments. */
  function lastLineWidth(el) {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
    const range = document.createRange()
    let line = null
    while (walker.nextNode()) {
      if (!walker.currentNode.textContent.trim()) continue
      range.selectNodeContents(walker.currentNode)
      for (const r of range.getClientRects()) {
        if (r.width < 1) continue
        if (!line || r.bottom > line.bottom + 1) line = { bottom: r.bottom, left: r.left, right: r.right }
        else if (Math.abs(r.bottom - line.bottom) <= 1) {
          line.left = Math.min(line.left, r.left)
          line.right = Math.max(line.right, r.right)
        }
      }
    }
    return line ? line.right - line.left : 0
  }

  let hero
  let canvas
  let copy
  let title
  let lede
  let scopeList
  let puddle
  let label
  let cue
  let liquid = $state(false)

  onMount(() => {
    const reduced = prefersReducedMotion()
    const surface = new LiquidSurface(canvas, { reducedMotion: reduced })
    liquid = surface.ok
    surface.onLost = () => (liquid = false)
    if (import.meta.env.DEV) window.__liquid = surface

    const rectIn = (el, frame) => {
      const r = el.getBoundingClientRect()
      return { l: r.left - frame.left, t: r.top - frame.top, r: r.right - frame.left, b: r.bottom - frame.top }
    }

    const syncText = () => {
      const c = canvas.getBoundingClientRect()
      const t = rectIn(copy, c)
      surface.setTextRect(t.l, t.t, t.r, t.b)
    }

    // Phones: the copy is centred and the lede breaks so each line is shorter than the one above,
    // narrowing the block like an inverted triangle down to the puddle at its point.
    const phone = window.matchMedia('(max-width: 767px)')
    let taperedAt = 0
    const taper = () => {
      const width = lede.clientWidth
      if (!phone.matches) {
        taperedAt = 0
        if (ledeBreaks.length) ledeBreaks = []
        return
      }
      if (width === taperedAt) return
      taperedAt = width
      const probe = document.createElement('span')
      probe.textContent = ' '
      lede.append(probe)
      const space = probe.getBoundingClientRect().width
      probe.remove()
      const widths = [...lede.querySelectorAll('.hero__word')].map((word) => word.getBoundingClientRect().width)

      // Start just inside the headline's last line and finish at the puddle's width.
      const titleEnd = lastLineWidth(title) || width * 0.8
      const from = Math.min(width * 0.9, titleEnd * 0.98)
      const to = Math.min(from * 0.8, puddle.getBoundingClientRect().width * 1.04)
      ledeBreaks = taperBreaks(widths, space, { from, to, max: width })
    }

    // The DOM is the source of truth for layout; the shader follows it.
    const sync = () => {
      if (!surface.ok) return
      surface.resize()
      const c = canvas.getBoundingClientRect()
      const p = rectIn(puddle, c)
      surface.setPuddle((p.l + p.r) / 2, (p.t + p.b) / 2, (p.r - p.l) / 2, (p.b - p.t) / 2)
      syncText()
      if (reduced) surface.renderOnce()
    }
    const relayout = () => {
      taper()
      sync()
    }
    relayout()
    const resizeObserver = new ResizeObserver(relayout)
    resizeObserver.observe(hero)
    resizeObserver.observe(copy)

    const ctx = gsap.context(() => {}, hero)
    let split

    // ----------------------------------------------------------- cursor
    const lightX = gsap.quickTo(surface.state, 'lightX', { duration: 0.9, ease: 'power3.out' })
    const lightY = gsap.quickTo(surface.state, 'lightY', { duration: 0.9, ease: 'power3.out' })
    const leanX = gsap.quickTo(surface.state, 'leanX', { duration: 1.2, ease: 'elastic.out(1, 0.5)' })
    const leanY = gsap.quickTo(surface.state, 'leanY', { duration: 1.2, ease: 'elastic.out(1, 0.5)' })
    const labelX = gsap.quickTo(label, 'x', { duration: 1.1, ease: 'elastic.out(1, 0.55)' })
    const labelY = gsap.quickTo(label, 'y', { duration: 1.1, ease: 'elastic.out(1, 0.55)' })
    let lampOn = false

    const setLamp = (on) => {
      if (on === lampOn) return
      lampOn = on
      gsap.to(surface.state, { light: on ? 1 : 0, duration: on ? 0.8 : 1.2, ease: 'power2.out', overwrite: 'auto' })
    }

    const settle = () => {
      surface.leave()
      setLamp(false)
      leanX(0)
      leanY(0)
      labelX(0)
      labelY(0)
    }

    const onPointerMove = (event) => {
      if (!surface.running) return
      const c = canvas.getBoundingClientRect()
      const x = event.clientX - c.left
      const y = event.clientY - c.top
      if (y < 0 || y > c.height) return settle()

      surface.move(x, y)
      if (event.pointerType === 'mouse') {
        if (!lampOn) {
          surface.state.lightX = x
          surface.state.lightY = y
        }
        lightX(x)
        lightY(y)
        setLamp(true)
      }

      // The puddle leans toward a nearby cursor, like surface tension reaching for it.
      const p = surface.puddle
      const dx = x - p.x
      const dy = y - p.y
      const reach = Math.max(p.rx, p.ry) * 1.8
      const pull = Math.max(0, 1 - Math.hypot(dx, dy) / reach)
      leanX(dx * 0.22 * pull)
      leanY(dy * 0.22 * pull)
      labelX(dx * 0.1 * pull)
      labelY(dy * 0.1 * pull)
    }

    const onPointerDown = (event) => {
      if (!surface.running) return
      const c = canvas.getBoundingClientRect()
      surface.drop(event.clientX - c.left, event.clientY - c.top, 22, -0.55)
    }

    if (!reduced) {
      window.addEventListener('pointermove', onPointerMove, { passive: true })
      hero.addEventListener('pointerdown', onPointerDown, { passive: true })
      document.documentElement.addEventListener('pointerleave', settle)
    }

    // ----------------------------------------------------------- puddle states
    const hoverIn = () => {
      gsap.to(surface.state, { hover: 1, duration: 1, ease: 'elastic.out(1, 0.45)', overwrite: 'auto' })
      surface.ring(0.24)
    }
    const hoverOut = () => gsap.to(surface.state, { hover: 0, duration: 0.8, ease: 'power3.out', overwrite: 'auto' })
    const press = () => gsap.to(surface.state, { press: 1, duration: 0.16, ease: 'power2.out', overwrite: 'auto' })
    const release = () => gsap.to(surface.state, { press: 0, duration: 1, ease: 'elastic.out(1, 0.4)', overwrite: 'auto' })
    const splash = () => surface.splash(0.9)

    const puddleEvents = [
      ['pointerenter', hoverIn],
      ['pointerleave', hoverOut],
      ['focus', hoverIn],
      ['blur', hoverOut],
      ['pointerdown', press],
      ['pointerup', release],
      ['pointercancel', release],
      ['click', splash],
    ]
    if (!reduced) puddleEvents.forEach(([type, fn]) => puddle.addEventListener(type, fn))

    // ----------------------------------------------------------- visibility + scroll
    const visibility = ScrollTrigger.create({
      trigger: hero,
      start: 'top bottom',
      end: 'bottom top',
      onToggle: (self) => (self.isActive ? surface.start() : surface.stop()),
    })

    if (!reduced) {
      ctx.add(() => {
        gsap
          .timeline({
            scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true, onUpdate: syncText },
          })
          .to(surface.state, { dim: 1, ease: 'none' }, 0)
          .to(copy, { yPercent: -12, ease: 'none' }, 0)
      })
    }

    // ----------------------------------------------------------- intro
    let cancelled = false
    waitForFonts().then(() => {
      if (cancelled) return
      taperedAt = 0 // word widths change once the real fonts arrive
      relayout()
      const introTargets = hero.querySelectorAll('[data-intro]')

      if (reduced) {
        Object.assign(surface.state, { reveal: 1, scale: 1 })
        gsap.set(introTargets, { visibility: 'visible' })
        surface.renderOnce()
        return
      }

      ctx.add(() => {
        split = SplitText.create(title, { type: 'lines', mask: 'lines', linesClass: 'line' })
        gsap.set(introTargets, { visibility: 'visible', animation: 'none' })
        gsap
          .timeline({ defaults: { ease: 'expo.out' } })
          .to(surface.state, { reveal: 1, duration: 2.6, ease: 'power2.out' }, 0)
          .add(() => surface.splash(), 0.25)
          .to(surface.state, { scale: 1, duration: 2.2 }, 0.3)
          .from(split.lines, { yPercent: 115, duration: 1.5, stagger: 0.1 }, 0.35)
          .from([lede, scopeList], { autoAlpha: 0, y: 26, duration: 1.3, stagger: 0.1 }, 0.8)
          .from(label, { autoAlpha: 0, scale: 0.82, duration: 1.3 }, 1.0)
          .from(cue, { autoAlpha: 0, duration: 1 }, 1.4)
      })
      if (visibility.isActive) surface.start()
    })

    return () => {
      cancelled = true
      resizeObserver.disconnect()
      visibility.kill()
      ctx.revert()
      split?.revert()
      window.removeEventListener('pointermove', onPointerMove)
      hero.removeEventListener('pointerdown', onPointerDown)
      document.documentElement.removeEventListener('pointerleave', settle)
      puddleEvents.forEach(([type, fn]) => puddle.removeEventListener(type, fn))
      surface.destroy()
    }
  })
</script>

<section
  id="intro"
  class="hero theme-dark"
  class:has-liquid={liquid}
  data-theme="dark"
  aria-labelledby="hero-title"
  bind:this={hero}
>
  <canvas class="hero__water" aria-hidden="true" bind:this={canvas}></canvas>

  <div class="hero__inner">
    <div class="hero__copy" bind:this={copy}>
      <h1 id="hero-title" class="hero__title" data-intro bind:this={title}>
        {heroCopy.title[0]} <br />{heroCopy.title[1]}
      </h1>
      <p class="hero__lede" data-intro bind:this={lede}>
        {#each ledeWords as word, i (i)}{#if ledeBreaks.includes(i)}<br />{/if}<svelte:element
            this={word.strong ? 'strong' : 'span'}
            class="hero__word">{word.text}</svelte:element
          >{' '}{/each}
      </p>
      <ul class="hero__scope mono" aria-label="What we cover" data-intro bind:this={scopeList}>
        {#each heroCopy.scope as item (item)}
          <li>{item}</li>
        {/each}
      </ul>
    </div>

    <div class="hero__cta">
      <a class="puddle" href="#contact" bind:this={puddle}>
        <span class="puddle__label" data-intro bind:this={label}>
          <span class="puddle__text">Start your <span class="puddle__line">project</span></span>
          <svg class="puddle__arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" /></svg>
        </span>
      </a>
    </div>

    <p class="hero__cue mono" aria-hidden="true" data-intro bind:this={cue}>
      <span class="hero__cue-line"></span>Scroll
    </p>
  </div>
</section>

<style>
  .hero {
    position: relative;
    min-height: max(660px, 100svh);
    overflow: clip;
    isolation: isolate;
  }

  .hero__water {
    position: absolute;
    inset: 0;
    z-index: -1;
    width: 100%;
    height: 100%;
    max-width: none;
  }

  /* No WebGL: a still pool with a faint grid, and a CSS puddle. */
  .hero:not(.has-liquid) {
    background:
      radial-gradient(ellipse 60% 70% at 70% 45%, rgb(243 243 241 / 0.06), transparent 70%),
      linear-gradient(rgb(243 243 241 / 0.04) 1px, transparent 1px) 0 0 / 64px 64px,
      linear-gradient(90deg, rgb(243 243 241 / 0.04) 1px, transparent 1px) 0 0 / 64px 64px,
      var(--ink);
  }

  .hero:not(.has-liquid) .hero__water {
    display: none;
  }

  .hero__inner {
    position: relative;
    min-height: inherit;
    margin-left: var(--rail);
    padding: calc(var(--bar) + clamp(28px, 6vh, 64px)) var(--gutter) clamp(28px, 5.5vh, 60px);
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    grid-template-rows: 1fr auto;
    column-gap: var(--gutter);
  }

  .hero__copy {
    grid-column: 1 / span 7;
    grid-row: 1 / span 2;
    align-self: end;
    padding-bottom: clamp(0px, 3vh, 32px);

  }

  .hero__title {
    font-size: var(--fs-hero);
    font-weight: 540;
    font-stretch: 92%;
    line-height: 0.86;
    letter-spacing: -0.056em;
    color: var(--paper);
    text-align: start;
    width: 100%;
    display: block;
  }

  .hero__lede {
    margin-top: clamp(26px, 4.5vh, 48px);
    max-width: 33ch;
    font-size: var(--fs-lead);
    line-height: 1.3;
    letter-spacing: -0.012em;
    color: var(--smoke);
    text-wrap: pretty;
  }

  .hero__lede strong {
    color: var(--paper);
    font-weight: 540;
  }

  .hero__scope {
    margin-top: clamp(22px, 3.5vh, 36px);
    display: flex;
    flex-wrap: wrap;
    row-gap: 6px;
    gap: 1rem;
    color: var(--ink);

    & li {
      background: #ffffff;
      padding: 12px 4px;
      width: fit-content;
      border-radius: 36px;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: clamp(13px, 1.2vw, 15px);
      &::after {
        content: '';
        margin: 0 10px;
      }
    }
  }

  .hero__scope li::before {
    content: '*';
    margin: 0 10px;
    opacity: 0.5;
  }

  .hero__cta {
    grid-column: 8 / span 5;
    grid-row: 1 / span 2;
    align-self: center;
    justify-self: center;
    margin-top: calc(var(--bar) * -1);
  }

  .puddle {
    display: grid;
    place-items: center;
    width: clamp(250px, 27vw, 470px);
    aspect-ratio: 1.2;
    border-radius: 50%;
    color: var(--ink);
    -webkit-tap-highlight-color: transparent;
  }

  .hero:not(.has-liquid) .puddle {
    background: radial-gradient(ellipse at 40% 35%, var(--white), #d9d9d7 70%, #bdbdbb);
    border-radius: 58% 42% 52% 48% / 48% 58% 42% 52%;
    animation: puddle-morph 16s ease-in-out infinite alternate;
  }

  @keyframes puddle-morph {
    50% {
      border-radius: 44% 56% 46% 54% / 56% 44% 56% 44%;
    }
    100% {
      border-radius: 52% 48% 60% 40% / 42% 54% 46% 58%;
    }
  }

  .puddle:focus-visible {
    outline: 2px solid var(--paper);
    outline-offset: 14px;
  }

  .puddle__label {
    display: inline-flex;
    align-items: center;
    gap: 14px;
    font-size: clamp(21px, 1.75vw, 31px);
    font-weight: 600;
    line-height: 0.98;
    letter-spacing: -0.035em;
  }

  .puddle__line {
    display: block;
  }

  .puddle__arrow {
    width: 1.05em;
    height: 1.05em;
    flex: none;
    fill: none;
    stroke: currentColor;
    stroke-width: 2.2;
    transition: transform 0.6s var(--ease-out);
  }

  .puddle:hover .puddle__arrow,
  .puddle:focus-visible .puddle__arrow {
    transform: rotate(-45deg);
  }

  .hero__cue {
    grid-column: 8 / span 5;
    grid-row: 2;
    justify-self: end;
    align-self: end;
    display: flex;
    align-items: center;
    gap: 12px;
    color: var(--smoke);
  }

  .hero__cue-line {
    position: relative;
    width: 48px;
    height: 1px;
    overflow: hidden;
    background: rgb(243 243 241 / 0.2);
  }

  .hero__cue-line::after {
    content: '';
    position: absolute;
    inset: 0;
    background: var(--paper);
    animation: cue 2.4s var(--ease-out) infinite;
  }

  @keyframes cue {
    0% {
      transform: translateX(-100%);
    }
    60%,
    100% {
      transform: translateX(100%);
    }
  }

  /* Phones and tablets: headline first, then the puddle, stacked. */
  @media (max-width: 1023px) {
    .hero__inner {
      grid-template-columns: minmax(0, 1fr);
      grid-template-rows: auto 1fr;
      row-gap: 40px;
    }

    .hero__copy {
      grid-column: 1;
      grid-row: 1;
      align-self: start;
      padding-bottom: 0;
    }

    .hero__title {
      font-size: clamp(54px, 15.5vw, 132px);
    }

    .hero__lede {
      max-width: 36ch;
    }

    .hero__cta {
      grid-column: 1;
      grid-row: 2;
      align-self: center;
      margin-top: 0;
    }

    .puddle {
      width: min(76vw, 420px);
    }

    .hero__cue {
      display: none;
    }
  }

  /* Phones: one centred block shaped like an inverted triangle — the headline is the base,
     the lede tapers line by line, and the puddle is the point. */
  @media (max-width: 767px) {
    .hero__inner {
      grid-template-rows: auto auto;
      align-content: center;
      row-gap: clamp(26px, 4.5svh, 44px);
    }

    .hero__copy {
      text-align: center;
    }

    .hero__title {
      font-size: min(16.4vw, 92px);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }

    .hero__lede {
      max-width: none;
      margin-top: clamp(20px, 3svh, 30px);
      font-size: clamp(17px, 4.7vw, 20px);
      line-height: 1.34;
      text-wrap: wrap;
    }

    /* The lede already names all three services; the tag row would widen the point. */
    .hero__scope {
      display: none;
    }

    .hero__cta {
      align-self: start;
    }

    .puddle {
      width: clamp(150px, 44vw, 190px);
    }

    .puddle__label {
      gap: 8px;
      font-size: clamp(16px, 4.4vw, 18px);
    }
  }
</style>

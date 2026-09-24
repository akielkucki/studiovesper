<script>
  import { onMount } from 'svelte'
  import Nav from './components/Nav.svelte'
  import Hero from './components/Hero.svelte'
  import Services from './components/Services.svelte'
  import Benefits from './components/Benefits.svelte'
  import Process from './components/Process.svelte'
  import Contact from './components/Contact.svelte'
  import Footer from './components/Footer.svelte'
  import { sections } from './lib/content.js'
  import { ui } from './lib/state.svelte.js'
  import { ScrollTrigger, initSmoothScroll, bindAnchorLinks, waitForFonts } from './lib/motion.js'
  import { initReveals } from './lib/reveal.js'

  let main

  onMount(() => {
    const stopSmoothScroll = initSmoothScroll()
    const unbindAnchors = bindAnchorLinks()
    const barOffset = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--bar')) || 0

    // Which section is under the middle of the viewport drives the navigation.
    const triggers = sections.map(({ id }, i) =>
      ScrollTrigger.create({
        trigger: `#${id}`,
        start: 'top 50%',
        end: i === sections.length - 1 ? 'max' : 'bottom 50%',
        onToggle: (self) => {
          if (self.isActive) ui.active = id
        },
      }),
    )

    // The mobile bar matches whichever section sits beneath it.
    document.querySelectorAll('[data-theme]').forEach((el) => {
      triggers.push(
        ScrollTrigger.create({
          trigger: el,
          start: () => `top ${barOffset()}px`,
          end: () => `bottom ${barOffset()}px`,
          onToggle: (self) => {
            if (self.isActive) ui.barTheme = el.dataset.theme
          },
        }),
      )
    })

    const stopReveals = initReveals(main)
    waitForFonts().then(() => ScrollTrigger.refresh())

    return () => {
      triggers.forEach((t) => t.kill())
      stopReveals()
      unbindAnchors()
      stopSmoothScroll()
    }
  })
</script>

<a class="skip-link" href="#main">Skip to content</a>
<Nav />
<main id="main" tabindex="-1" bind:this={main}>
  <Hero />
  <Services />
  <Benefits />
  <Process />
  <Contact />
</main>
<Footer />

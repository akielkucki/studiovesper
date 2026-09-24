<script>
  import { onMount } from 'svelte'
  import { gsap, ScrollTrigger, prefersReducedMotion } from '../lib/motion.js'
  import { services } from '../lib/content.js'
  import Meniscus from './Meniscus.svelte'
  import StackGraphic from './StackGraphic.svelte'

  let active = $state(-1)
  let spread = $state(prefersReducedMotion() ? 1 : 0)
  let assembled = $state(false)
  const items = $state([])
  let body

  onMount(() => {
    const last = items.length - 1
    // Each layer lights up while its description crosses the middle of the screen.
    const triggers = items.map((el, i) =>
      ScrollTrigger.create({
        trigger: el,
        start: 'top 55%',
        end: 'bottom 55%',
        onEnter: () => (active = i),
        onEnterBack: () => (active = i),
        onLeave: () => i === last && (active = -1),
        onLeaveBack: () => i === 0 && (active = -1),
      }),
    )

    // While the stack is pinned, the packed block opens into layers as the section arrives,
    // and packs back into one solid block after the last layer has had its turn.
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const proxy = { spread: 0 }
      const apply = () => (spread = proxy.spread)
      gsap.fromTo(
        proxy,
        { spread: 0 },
        {
          spread: 1,
          ease: 'power2.inOut',
          onUpdate: apply,
          scrollTrigger: { trigger: body, start: 'top 85%', end: 'top 30%', scrub: 0.8 },
        },
      )
      gsap.fromTo(
        proxy,
        { spread: 1 },
        {
          spread: 0,
          ease: 'power2.inOut',
          immediateRender: false,
          onUpdate: apply,
          scrollTrigger: {
            trigger: body,
            start: 'bottom 108%',
            end: 'bottom 80%',
            scrub: 0.8,
            onUpdate: (self) => (assembled = self.progress > 0.85),
          },
        },
      )
    })

    return () => {
      triggers.forEach((t) => t.kill())
      mm.revert()
    }
  })
</script>

<section id="services" class="section services theme-light" data-theme="light" aria-labelledby="services-title">
  <Meniscus fill="var(--ink)" />
  <div class="section__inner">
    <header class="services__head">
      <h2 id="services-title" class="display services__title" data-reveal="lines">
        The whole site. <br />One studio.
      </h2>
      <p class="label services__note" data-reveal="fade">{services.length} layers, one team</p>
    </header>

    <p class="services__statement" data-reveal="words">
      mainstreetlander designs and builds websites for local businesses — then connects missed-call text back, so every
      call you can't pick up still gets an answer.
    </p>

    <div class="services__body" bind:this={body}>
      <div class="services__visual">
        <StackGraphic layers={services.map((s) => s.slab)} {active} {spread} {assembled} />
      </div>

      <ol class="services__list">
        {#each services as service, i (service.name)}
          <li class="service" class:is-active={i === active} bind:this={items[i]}>
            <p class="label service__tag"><span class="service__marker" aria-hidden="true"></span>{service.tag}</p>
            <h3 class="service__name">{service.name}</h3>
            <p class="service__body">{service.body}</p>
            <ul class="service__includes mono" aria-label={`${service.name} includes`}>
              {#each service.includes as item (item)}
                <li>{item}</li>
              {/each}
            </ul>
          </li>
        {/each}
      </ol>
    </div>
  </div>
</section>

<style>
  .services__head {
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    column-gap: var(--gutter);
    align-items: end;
  }

  .services__title {
    grid-column: 1 / span 9;
  }

  .services__note {
    grid-column: 10 / span 3;
    justify-self: end;
    text-align: right;
    padding-bottom: 0.6em;
  }

  .services__statement {
    margin-top: clamp(64px, 9vw, 150px);
    max-width: 30ch;
    margin-left: auto;
    font-size: clamp(26px, 3.1vw, 58px);
    font-weight: 500;
    line-height: 1.08;
    letter-spacing: -0.035em;
    text-wrap: pretty;
  }

  .services__body {
    margin-top: clamp(72px, 9vw, 150px);
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    column-gap: var(--gutter);
  }

  /* Pinned in the middle of the screen for as long as the descriptions scroll past. */
  .services__visual {
    grid-column: 1 / span 5;
    position: sticky;
    top: calc(50vh - min(260px, 42vh));
    align-self: start;
    display: grid;
    justify-items: center;
  }

  /* The runway after the last layer keeps the stack pinned while it packs back together. */
  .services__list {
    grid-column: 7 / span 6;
    padding-bottom: 40vh;
  }

  .service {
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-height: 74vh;
    padding: clamp(44px, 5.5vw, 80px) 0;
    border-top: 1px solid var(--line);
  }

  .service__tag {
    display: flex;
    align-items: center;
    gap: 0;
  }

  /* A single block marks the layer that is lit in the stack. */
  .service__marker {
    width: 10px;
    height: 10px;
    background: var(--ink);
    transform: scale(0);
    margin-right: 0;
    transition:
      transform 0.6s var(--ease-out),
      margin-right 0.6s var(--ease-out);
  }

  .service.is-active .service__marker {
    transform: scale(1);
    margin-right: 10px;
  }

  .service:last-child {
    border-bottom: 1px solid var(--line);
  }

  .service__name {
    margin-top: 14px;
    font-size: var(--fs-h3);
    font-weight: 540;
    line-height: 1;
    letter-spacing: -0.04em;
  }

  .service__body {
    margin-top: 20px;
    max-width: 42ch;
    text-wrap: pretty;
  }

  .service__includes {
    margin-top: 26px;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .service__includes li {
    padding: 7px 13px;
    border: 1px solid var(--line);
    border-radius: 999px;
  }

  /* Phones and tablets: the stack pins under the top bar and the descriptions scroll beneath it. */
  @media (max-width: 1023px) {
    .services__title {
      grid-column: 1 / -1;
    }

    .services__note {
      grid-column: 1 / -1;
      justify-self: start;
      text-align: left;
      margin-top: 20px;
    }

    .services__statement {
      margin-left: 0;
    }

    .services__body {
      display: block;
    }

    .services__visual {
      top: var(--bar);
      z-index: 2;
      grid-template-rows: minmax(0, 1fr);
      align-items: center;
      height: clamp(220px, 36svh, 360px);
      margin: 0 calc(var(--gutter) * -1);
      padding: 14px var(--gutter) 26px;
      background: linear-gradient(to bottom, var(--paper) 80%, rgb(243 243 241 / 0));
    }

    .services__visual :global(svg.stack) {
      width: auto;
      height: 100%;
      max-width: 100%;
    }

    .service {
      min-height: 62svh;
    }
  }
</style>

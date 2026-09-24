<script>
  import { onMount } from 'svelte'
  import { gsap } from '../lib/motion.js'
  import { steps } from '../lib/content.js'
  import Meniscus from './Meniscus.svelte'

  let list

  onMount(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const rules = list.querySelectorAll('.step__rule')
      const bodies = list.querySelectorAll('.step__content')
      gsap
        .timeline({ scrollTrigger: { trigger: list, start: 'top 80%', once: true } })
        .from(rules, { scaleX: 0, duration: 1.2, ease: 'expo.inOut', stagger: 0.14 })
        .from(bodies, { autoAlpha: 0, y: 30, duration: 1.1, ease: 'expo.out', stagger: 0.14 }, 0.35)
    })
    return () => mm.revert()
  })
</script>

<section id="process" class="section process theme-light" data-theme="light" aria-labelledby="process-title">
  <Meniscus fill="var(--ink)" />
  <div class="section__inner">
    <header class="process__head">
      <h2 id="process-title" class="display" data-reveal="lines">From first call <br />to first lead.</h2>
      <p class="label process__note" data-reveal="fade">Four steps, in order</p>
    </header>

    <ol class="steps" bind:this={list}>
      {#each steps as step, i (step.title)}
        <li class="step">
          <span class="step__rule" aria-hidden="true"></span>
          <div class="step__content">
            <span class="step__num mono" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
            <h3 class="step__title">{step.title}</h3>
            <p class="step__body">{step.body}</p>
            <p class="step__out mono"><span class="muted">You get</span> {step.output}</p>
          </div>
        </li>
      {/each}
    </ol>
  </div>
</section>

<style>
  .process__head {
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    column-gap: var(--gutter);
    align-items: end;
  }

  .process__head .display {
    grid-column: 1 / span 9;
  }

  .process__note {
    grid-column: 10 / span 3;
    justify-self: end;
    padding-bottom: 0.6em;
  }

  .steps {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    column-gap: var(--gutter);
    row-gap: 56px;
    margin-top: clamp(72px, 9vw, 150px);
  }

  .step {
    position: relative;
    padding-top: 28px;
  }

  .step__rule {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: var(--ink);
    transform-origin: left;
  }

  .step__content {
    display: grid;
    align-content: start;
    height: 100%;
  }

  .step__num {
    color: var(--muted);
  }

  .step__title {
    margin-top: clamp(40px, 5vw, 88px);
    font-size: var(--fs-h3);
    font-weight: 540;
    line-height: 1;
    letter-spacing: -0.04em;
  }

  .step__body {
    margin-top: 18px;
    max-width: 30ch;
    text-wrap: pretty;
  }

  .step__out {
    margin-top: auto;
    padding-top: 28px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  @media (max-width: 1023px) {
    .process__head .display,
    .process__note {
      grid-column: 1 / -1;
      justify-self: start;
    }

    .process__note {
      margin-top: 20px;
    }

    .steps {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 599px) {
    .steps {
      grid-template-columns: minmax(0, 1fr);
      row-gap: 48px;
    }

    .step__title {
      margin-top: 28px;
    }
  }
</style>

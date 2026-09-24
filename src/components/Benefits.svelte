<script>
  import { benefits } from '../lib/content.js'
  import Meniscus from './Meniscus.svelte'
  import SiteMock from './demos/SiteMock.svelte'
  import TextBack from './demos/TextBack.svelte'
  import Checklist from './demos/Checklist.svelte'
</script>

<section id="benefits" class="section benefits theme-dark" data-theme="dark" aria-labelledby="benefits-title">
  <Meniscus fill="var(--paper)" />
  <div class="section__inner">
    <header class="benefits__head">
      <h2 id="benefits-title" class="label">Benefits</h2>
      <p class="benefits__intro lead" data-reveal="fade">Three things every mainstreetlander site is built on.</p>
    </header>

    {#each benefits as benefit (benefit.id)}
      <article class="benefit" aria-labelledby={`benefit-${benefit.id}`}>
        <h3 id={`benefit-${benefit.id}`} class="display benefit__title" data-reveal="lines">
          {benefit.title[0]} <br />{benefit.title[1]}
        </h3>
        <p class="benefit__body" data-reveal="fade">{benefit.body}</p>
        <div class="benefit__demo" data-reveal="fade">
          {#if benefit.demo === 'site'}
            <SiteMock />
          {:else if benefit.demo === 'sms'}
            <TextBack />
          {:else}
            <Checklist />
          {/if}
        </div>
      </article>
    {/each}
  </div>
</section>

<style>
  .benefits__head {
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    column-gap: var(--gutter);
    align-items: baseline;
    padding-bottom: clamp(48px, 6vw, 96px);
  }

  .benefits__head .label {
    grid-column: 1 / span 3;
  }

  .benefits__intro {
    grid-column: 4 / span 6;
    max-width: 24ch;
    font-size: clamp(22px, 2vw, 34px);
    letter-spacing: -0.025em;
  }

  .benefit {
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    grid-template-rows: auto 1fr;
    column-gap: var(--gutter);
    row-gap: clamp(24px, 3vw, 40px);
    padding: clamp(72px, 9vw, 150px) 0;
    border-top: 1px solid var(--line);
  }

  .benefit:last-child {
    padding-bottom: 0;
  }

  .benefit__title {
    grid-column: 1 / span 7;
    grid-row: 1;
  }

  .benefit__body {
    grid-column: 1 / span 5;
    grid-row: 2;
    align-self: start;
    max-width: 34ch;
    font-size: var(--fs-lead);
    line-height: 1.32;
    letter-spacing: -0.012em;
    color: var(--muted);
    text-wrap: pretty;
  }

  .benefit__demo {
    grid-column: 8 / span 5;
    grid-row: 1 / span 2;
    align-self: center;
  }

  @media (max-width: 1023px) {
    .benefits__head .label,
    .benefits__intro {
      grid-column: 1 / -1;
    }

    .benefits__intro {
      margin-top: 16px;
    }

    .benefit__title,
    .benefit__body,
    .benefit__demo {
      grid-column: 1 / -1;
      grid-row: auto;
    }

    .benefit__demo {
      margin-top: 16px;
      max-width: 560px;
    }
  }
</style>

<script>
  import { onMount } from 'svelte'
  import { gsap, SplitText, prefersReducedMotion, waitForFonts } from '../lib/motion.js'
  import { inquiry } from '../lib/content.js'

  let mark
  let word

  onMount(() => {
    let split
    let tween
    let cancelled = false

    // Scale the wordmark so it spans the footer exactly, at any width.
    const fit = () => {
      word.style.fontSize = '100px'
      const width = word.getBoundingClientRect().width
      if (width) word.style.fontSize = `${(100 * mark.clientWidth) / width}px`
    }

    const observer = new ResizeObserver(fit)
    waitForFonts().then(() => {
      if (cancelled) return
      if (!prefersReducedMotion()) {
        split = SplitText.create(word, { type: 'chars', mask: 'chars', charsClass: 'char' })
        tween = gsap.from(split.chars, {
          yPercent: 105,
          duration: 1.3,
          ease: 'expo.out',
          stagger: 0.035,
          scrollTrigger: { trigger: mark, start: 'top 92%', once: true },
        })
      }
      fit()
      observer.observe(mark)
    })

    return () => {
      cancelled = true
      observer.disconnect()
      tween?.scrollTrigger?.kill()
      tween?.kill()
      split?.revert()
    }
  })
</script>

<footer class="footer theme-dark" data-theme="dark">
  <div class="section__inner">
    <div class="footer__top">
      <p class="footer__line">Websites and missed-call text back for local businesses.</p>
      <ul class="footer__links">
        <li><a href={`mailto:${inquiry.email}`}>{inquiry.email}</a></li>
        <li><a href="#intro">Back to top</a></li>
      </ul>
    </div>

    <div class="footer__mark" bind:this={mark}>
      <span class="footer__word" aria-hidden="true" bind:this={word}>mainstreetlander</span>
    </div>

    <div class="footer__base mono">
      <span>© 2026 mainstreetlander</span>
      <span>Web design studio</span>
    </div>
  </div>
</footer>

<style>
  .footer {
    position: relative;
    padding: clamp(56px, 6vw, 96px) 0 28px;
    border-top: 1px solid var(--line);
  }

  .footer__top {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: baseline;
    gap: 24px 48px;
  }

  .footer__line {
    max-width: 30ch;
    font-size: var(--fs-lead);
    line-height: 1.3;
    letter-spacing: -0.015em;
    color: var(--muted);
  }

  .footer__links {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 28px;
  }

  .footer__links a {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    font-weight: 520;
    letter-spacing: -0.01em;
    background: linear-gradient(currentColor, currentColor) left calc(100% - 10px) / 0% 1px no-repeat;
    transition: background-size 0.5s var(--ease-out);
  }

  .footer__links a:hover {
    background-size: 100% 1px;
  }

  .footer__mark {
    margin-top: clamp(64px, 9vw, 160px);
    overflow-x: clip;
  }

  .footer__word {
    display: inline-block;
    font-size: 16vw;
    font-weight: 560;
    font-stretch: 92%;
    line-height: 0.82;
    letter-spacing: -0.06em;
    white-space: nowrap;
    padding-bottom: 0.04em;
  }

  .footer__base {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 8px 24px;
    margin-top: 28px;
    color: var(--muted);
  }
</style>

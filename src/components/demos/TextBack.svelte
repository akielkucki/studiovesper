<script>
  import { onMount } from 'svelte'
  import { gsap, ScrollTrigger, prefersReducedMotion } from '../../lib/motion.js'

  // One missed call, from the business's side: the auto-reply goes out, and the job gets booked.
  const thread = [
    {
      out: true,
      text: "Hi, it's Oakline Roofing — sorry we missed your call! How can we help?",
      meta: 'Sent automatically · 2:14 PM',
    },
    { out: false, text: 'Hi! Got a leak over the kitchen. Can someone come out today?' },
    { out: true, text: 'We can be there at 4. Does that work?' },
    { out: false, text: 'Perfect, see you then.' },
  ]

  let root

  onMount(() => {
    if (prefersReducedMotion()) return
    const missed = root.querySelector('.sms__missed')
    const messages = root.querySelectorAll('.sms__msg')
    const foot = root.querySelector('.sms__foot')

    const tl = gsap.timeline({ paused: true, defaults: { ease: 'expo.out' } })
    tl.from(missed, { autoAlpha: 0, y: 10, duration: 0.6 })
    messages.forEach((msg, i) => {
      const at = 0.5 + i * 1.05
      const bubble = msg.querySelector('p')
      const typing = msg.querySelector('.sms__typing')
      tl.from(msg, { autoAlpha: 0, y: 12, duration: 0.6, transformOrigin: thread[i].out ? '100% 100%' : '0% 100%' }, at)
      if (typing) {
        // Replies from the business show a moment of typing first.
        tl.from(bubble, { autoAlpha: 0, scale: 0.94, duration: 0.6 }, at + 0.55).fromTo(
          typing,
          { autoAlpha: 1 },
          { autoAlpha: 0, duration: 0.2 },
          at + 0.5,
        )
      }
    })
    tl.from(foot, { autoAlpha: 0, y: 8, duration: 0.6 }, '+=0.2')

    const trigger = ScrollTrigger.create({
      trigger: root,
      start: 'top 75%',
      onEnter: () => tl.restart(),
      onEnterBack: () => tl.restart(),
    })
    return () => {
      trigger.kill()
      tl.kill()
    }
  })
</script>

<figure class="sms" bind:this={root}>
  <div class="sms__head">
    <span class="sms__who">
      <span class="sms__avatar" aria-hidden="true">JM</span>
      <span>
        <span class="sms__name">(555) 014-2291</span>
        <span class="sms__sub mono">New lead</span>
      </span>
    </span>
    <span class="sms__badge mono">Text back on</span>
  </div>

  <p class="sms__missed mono">
    <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M13 3 7 9M7 4v5h5" /></svg>
    Missed call · 2:14 PM
  </p>

  <ol class="sms__thread">
    {#each thread as message, i (i)}
      <li class="sms__msg" class:is-out={message.out}>
        <p>{message.text}</p>
        {#if message.out}<span class="sms__typing" aria-hidden="true"><i></i><i></i><i></i></span>{/if}
        {#if message.meta}<span class="sms__meta mono">{message.meta}</span>{/if}
      </li>
    {/each}
  </ol>

  <figcaption class="sms__foot mono">Lead saved · you were notified</figcaption>
</figure>

<style>
  .sms {
    position: relative;
    border-radius: 18px;
    border: 1px solid var(--line);
    background: var(--raised);
    overflow: hidden;
  }

  .sms__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 14px 16px;
    border-bottom: 1px solid var(--line);
  }

  .sms__who {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .sms__avatar {
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: var(--paper);
    color: var(--ink);
    font-size: 12px;
    font-weight: 700;
  }

  .sms__name {
    display: block;
    font-size: 15px;
    font-weight: 600;
    letter-spacing: -0.01em;
  }

  .sms__sub {
    display: block;
    color: var(--muted);
    font-size: 10.5px;
  }

  .sms__badge {
    padding: 5px 10px;
    border-radius: 999px;
    border: 1px solid var(--line);
    color: var(--muted);
    font-size: 10.5px;
    white-space: nowrap;
  }

  .sms__missed {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin: 16px 16px 4px;
    color: var(--muted);
  }

  .sms__missed svg {
    width: 14px;
    height: 14px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.6;
  }

  .sms__thread {
    display: grid;
    gap: 10px;
    padding: 14px 16px 18px;
  }

  .sms__msg {
    position: relative;
    justify-self: start;
    max-width: 82%;
    display: grid;
    gap: 6px;
  }

  .sms__msg p {
    padding: 10px 14px;
    border-radius: 16px 16px 16px 4px;
    background: rgb(243 243 241 / 0.1);
    font-size: 15px;
    line-height: 1.38;
    letter-spacing: -0.005em;
  }

  .sms__msg.is-out {
    justify-self: end;
    justify-items: end;
  }

  .sms__msg.is-out p {
    border-radius: 16px 16px 4px 16px;
    background: var(--paper);
    color: var(--ink);
  }

  .sms__meta {
    color: var(--muted);
    font-size: 10px;
  }

  /* Sits over the corner of the reply it precedes; hidden until the animation runs. */
  .sms__typing {
    position: absolute;
    top: 0;
    right: 0;
    display: flex;
    gap: 4px;
    padding: 12px 14px;
    border-radius: 16px 16px 4px 16px;
    background: var(--paper);
    opacity: 0;
    visibility: hidden;
  }

  .sms__typing i {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--ink);
    animation: blink 1s infinite ease-in-out;
  }

  .sms__typing i:nth-child(2) {
    animation-delay: 0.15s;
  }

  .sms__typing i:nth-child(3) {
    animation-delay: 0.3s;
  }

  @keyframes blink {
    50% {
      opacity: 0.25;
    }
  }

  .sms__foot {
    padding: 14px 16px;
    border-top: 1px solid var(--line);
    color: var(--muted);
  }
</style>

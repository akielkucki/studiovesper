<script>
  import { tick } from 'svelte'
  import { inquiry } from '../lib/content.js'
  import Meniscus from './Meniscus.svelte'

  let form = $state({ name: '', email: '', business: '', industry: '', needs: [], message: '' })
  let errors = $state({})
  let status = $state('idle') // idle | sending | sent | mailto | error
  let formEl = $state()

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  const statusMessage = $derived(
    {
      mailto: `Your email app should open with the inquiry filled in. If it doesn't, write to ${inquiry.email}.`,
      error: `The inquiry didn't send. Check your connection and try again, or write to ${inquiry.email}.`,
    }[status] ?? '',
  )

  function validate() {
    const next = {}
    if (!form.name.trim()) next.name = 'Enter your name.'
    if (!form.email.trim()) next.email = 'Enter your email so we can reply.'
    else if (!emailPattern.test(form.email.trim())) next.email = 'Enter an email address like name@example.com.'
    errors = next
    return Object.keys(next).length === 0
  }

  function summary() {
    return [
      `Name: ${form.name}`,
      `Email: ${form.email}`,
      form.business && `Business: ${form.business}`,
      form.industry && `Industry: ${form.industry}`,
      form.needs.length > 0 && `Needs: ${form.needs.join(', ')}`,
      form.message && `\n${form.message}`,
    ]
      .filter(Boolean)
      .join('\n')
  }

  async function submit(event) {
    event.preventDefault()
    if (!validate()) {
      await tick()
      formEl.querySelector('[aria-invalid="true"]')?.focus()
      return
    }

    if (!inquiry.endpoint) {
      const subject = `Project inquiry — ${form.business.trim() || form.name.trim()}`
      window.location.href = `mailto:${inquiry.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(summary())}`
      status = 'mailto'
      return
    }

    status = 'sending'
    try {
      const response = await fetch(inquiry.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ ...form, needs: [...form.needs] }),
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      status = 'sent'
    } catch {
      status = 'error'
    }
  }
</script>

<section id="contact" class="section contact theme-dark" data-theme="dark" aria-labelledby="contact-title">
  <Meniscus fill="var(--paper)" />
  <div class="section__inner">
    <h2 id="contact-title" class="contact__title" data-reveal="lines">Start your <br />project</h2>

    <div class="contact__grid">
      <div class="contact__aside">
        <p class="contact__intro" data-reveal="fade">
          Tell us about your business and what you need. We'll reply by email with next steps and a quote.
        </p>
        <p class="contact__direct" data-reveal="fade">
          <span class="label">Prefer email?</span>
          <a class="contact__email" href={`mailto:${inquiry.email}`}>{inquiry.email}</a>
        </p>
      </div>

      {#if status === 'sent'}
        <div class="contact__done" role="status">
          <p class="contact__done-title">Inquiry sent.</p>
          <p class="muted">We'll reply to {form.email} with next steps.</p>
        </div>
      {:else}
        <form class="form" novalidate onsubmit={submit} bind:this={formEl} data-reveal="fade">
          <div class="form__row">
            <div class="field">
              <label for="f-name">Your name</label>
              <input
                id="f-name"
                name="name"
                autocomplete="name"
                required
                bind:value={form.name}
                aria-invalid={errors.name ? 'true' : undefined}
                aria-describedby={errors.name ? 'f-name-error' : undefined}
              />
              {#if errors.name}<p class="field__error" id="f-name-error">{errors.name}</p>{/if}
            </div>
            <div class="field">
              <label for="f-email">Email</label>
              <input
                id="f-email"
                name="email"
                type="email"
                autocomplete="email"
                inputmode="email"
                required
                bind:value={form.email}
                aria-invalid={errors.email ? 'true' : undefined}
                aria-describedby={errors.email ? 'f-email-error' : undefined}
              />
              {#if errors.email}<p class="field__error" id="f-email-error">{errors.email}</p>{/if}
            </div>
          </div>

          <div class="form__row">
            <div class="field">
              <label for="f-business">Business name <span class="muted">(optional)</span></label>
              <input id="f-business" name="business" autocomplete="organization" bind:value={form.business} />
            </div>
            <div class="field">
              <label for="f-industry">Industry</label>
              <select id="f-industry" name="industry" bind:value={form.industry}>
                <option value="">Choose one</option>
                {#each inquiry.industries as industry (industry)}
                  <option value={industry}>{industry}</option>
                {/each}
              </select>
            </div>
          </div>

          <fieldset class="field">
            <legend>What do you need?</legend>
            <div class="chips">
              {#each inquiry.needs as need (need)}
                <label class="chip">
                  <input type="checkbox" name="needs" value={need} bind:group={form.needs} />
                  <span>{need}</span>
                </label>
              {/each}
            </div>
          </fieldset>

          <div class="field">
            <label for="f-message">About your business <span class="muted">(optional)</span></label>
            <textarea
              id="f-message"
              name="message"
              rows="4"
              bind:value={form.message}
              placeholder="What you do, where you work, what isn't working today…"
            ></textarea>
          </div>

          <div class="form__submit">
            <button class="submit" type="submit" disabled={status === 'sending'}>
              {status === 'sending' ? 'Sending inquiry…' : 'Send inquiry'}
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" /></svg>
            </button>
            <p class="form__status" role="status" aria-live="polite">{statusMessage}</p>
          </div>
        </form>
      {/if}
    </div>
  </div>
</section>

<style>
  .contact {
    padding-bottom: clamp(96px, 10vw, 180px);
  }

  .contact__title {
    font-size: clamp(64px, 11.5vw, 236px);
    font-weight: 540;
    font-stretch: 92%;
    line-height: 0.86;
    letter-spacing: -0.058em;
  }

  .contact__grid {
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    column-gap: var(--gutter);
    row-gap: 56px;
    margin-top: clamp(56px, 7vw, 120px);
  }

  .contact__aside {
    grid-column: 1 / span 4;
    display: grid;
    align-content: start;
    gap: 40px;
  }

  .contact__intro {
    max-width: 30ch;
    font-size: var(--fs-lead);
    line-height: 1.32;
    letter-spacing: -0.012em;
    color: var(--muted);
    text-wrap: pretty;
  }

  .contact__direct {
    display: grid;
    gap: 8px;
  }

  .contact__email {
    justify-self: start;
    font-size: clamp(18px, 1.4vw, 22px);
    font-weight: 520;
    letter-spacing: -0.02em;
    background: linear-gradient(currentColor, currentColor) left bottom / 100% 1px no-repeat;
    padding-bottom: 3px;
    transition: background-size 0.6s var(--ease-out);
  }

  .contact__email:hover {
    background-size: 0% 1px;
    background-position: right bottom;
  }

  .form,
  .contact__done {
    grid-column: 6 / span 7;
  }

  .form {
    display: grid;
    gap: 34px;
  }

  .form__row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 34px var(--gutter);
  }

  .field {
    display: grid;
    align-content: start;
    gap: 10px;
    border: 0;
    min-width: 0;
  }

  .field label,
  .field legend {
    font-family: var(--font-mono);
    font-size: var(--fs-label);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--muted);
    padding: 0;
  }

  .field legend {
    margin-bottom: 14px;
  }

  input:not([type='checkbox']),
  select,
  textarea {
    width: 100%;
    padding: 12px 0 14px;
    border: 0;
    border-bottom: 1px solid rgb(243 243 241 / 0.3);
    border-radius: 0;
    background: transparent;
    font-size: clamp(18px, 1.3vw, 21px);
    letter-spacing: -0.01em;
    transition: border-color 0.3s;
  }

  textarea {
    resize: vertical;
    min-height: 120px;
    line-height: 1.45;
  }

  select {
    appearance: none;
    padding-right: 28px;
    background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23f3f3f1' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")
      right 2px center / 18px no-repeat;
    cursor: pointer;
  }

  select option {
    background: var(--ink);
    color: var(--paper);
  }

  ::placeholder {
    color: rgb(243 243 241 / 0.46);
  }

  input:not([type='checkbox']):focus-visible,
  select:focus-visible,
  textarea:focus-visible {
    outline: none;
    border-bottom-color: var(--paper);
    box-shadow: 0 1px 0 var(--paper);
  }

  input[aria-invalid='true'] {
    border-bottom-color: var(--paper);
    border-bottom-style: dashed;
  }

  .field__error {
    font-family: var(--font-mono);
    font-size: var(--fs-label);
    color: var(--paper);
  }

  .field__error::before {
    content: '— ';
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .chip {
    position: relative;
    cursor: pointer;
  }

  .chip input {
    position: absolute;
    opacity: 0;
    inset: 0;
    margin: 0;
    cursor: pointer;
  }

  .chip span {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: 0 18px;
    border: 1px solid rgb(243 243 241 / 0.3);
    border-radius: 999px;
    font-family: var(--font-sans);
    font-size: 15px;
    letter-spacing: -0.01em;
    text-transform: none;
    color: var(--fg);
    transition:
      background-color 0.3s var(--ease-out),
      color 0.3s var(--ease-out),
      border-color 0.3s var(--ease-out);
  }

  .chip:hover span {
    border-color: var(--paper);
  }

  .chip input:checked + span {
    background: var(--paper);
    border-color: var(--paper);
    color: var(--ink);
  }

  .chip input:focus-visible + span {
    outline: 2px solid var(--paper);
    outline-offset: 3px;
  }

  .form__submit {
    display: grid;
    justify-items: start;
    gap: 18px;
    margin-top: 8px;
  }

  .submit {
    display: inline-flex;
    align-items: center;
    gap: 14px;
    min-height: 64px;
    padding: 0 30px 0 34px;
    border: 0;
    border-radius: 32px;
    background: var(--paper);
    color: var(--ink);
    font-size: clamp(18px, 1.4vw, 22px);
    font-weight: 600;
    letter-spacing: -0.02em;
    cursor: pointer;
    transition:
      border-radius 0.6s var(--ease-out),
      transform 0.6s var(--ease-out);
  }

  .submit svg {
    width: 20px;
    height: 20px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2.2;
    transition: transform 0.6s var(--ease-out);
  }

  /* A small liquid wobble, echoing the puddle in the hero. */
  .submit:hover {
    border-radius: 38px 26px 34px 30px / 28px 36px 26px 34px;
  }

  .submit:hover svg {
    transform: translateX(4px);
  }

  .submit:disabled {
    cursor: progress;
    opacity: 0.7;
  }

  .submit:focus-visible {
    outline: 2px solid var(--paper);
    outline-offset: 4px;
  }

  .form__status {
    max-width: 48ch;
    font-size: 15px;
    color: var(--muted);
  }

  .form__status:empty {
    display: none;
  }

  .contact__done {
    display: grid;
    align-content: start;
    gap: 12px;
    padding-top: 12px;
  }

  .contact__done-title {
    font-size: var(--fs-h3);
    font-weight: 560;
    letter-spacing: -0.04em;
  }

  @media (max-width: 1023px) {
    .contact__aside,
    .form,
    .contact__done {
      grid-column: 1 / -1;
    }
  }

  @media (max-width: 599px) {
    .form__row {
      grid-template-columns: 1fr;
    }
  }
</style>

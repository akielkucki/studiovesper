# StudioVesper

Site for StudioVesper — web design for local businesses, plus missed-call text back.
Vite + Svelte 5, GSAP 3.15 (ScrollTrigger, SplitText), Lenis smooth scrolling, and a hand-written WebGL2 water surface in the hero.

```bash
npm install
npm run types    # regenerate Cloudflare binding/runtime types
npm run dev      # http://localhost:5173
npm run build    # static output in dist/
```

For local form submissions, copy `.dev.vars.example` to `.dev.vars` and set `DISCORD_WEBHOOK_URL` to the Discord webhook URL. The local secrets file is ignored by Git.

Before deploying, store the production webhook as an encrypted Cloudflare secret, then deploy:

```bash
npx wrangler secret put DISCORD_WEBHOOK_URL
npm run deploy
```

## Before launch

- **Inbox:** replace `hello@studiovesper.com` in `src/lib/content.js`.
- **Inquiry form:** configure `DISCORD_WEBHOOK_URL` as described above. The webhook stays server-side and form submissions are sent through `/api/contact`.
- **Copy:** every string lives in `src/lib/content.js`, apart from the section headlines inside each component.
  The service details and the Oakline Roofing examples in the benefit illustrations are placeholders — check them against what you actually offer.

## Where things are

| Path | What it does |
| --- | --- |
| `src/lib/liquid/` | The hero water: a height-field ripple simulation, a drop pass for cursor strokes and rain, and a render pass that shades dark water over a refracted layout grid plus the liquid-metal puddle. |
| `src/components/Hero.svelte` | Owns layout and input. The DOM is the source of truth — the shader reads the puddle link's and headline's positions, so the CTA is always a real, focusable `<a>`. On phones the copy is centred and tapered into an inverted triangle (`src/lib/taper.js` picks the line breaks). |
| `src/components/Nav.svelte` | Desktop rail (a full-height flex stack; the active item's `flex-grow` tweens to 2) and the mobile top bar. |
| `src/components/Services.svelte`, `StackGraphic.svelte` | The pinned layer stack: it opens as the section arrives, lights each layer with its description, and packs back into one block at the end. |
| `src/lib/motion.js`, `src/lib/reveal.js` | GSAP/Lenis setup, anchor scrolling with focus handoff, and `data-reveal="lines|words|fade"` scroll reveals. |
| `src/components/demos/` | The three benefit illustrations: client site, missed-call text thread, conversion checklist. |

## Motion and fallbacks

- `prefers-reduced-motion`: no smooth scrolling, no reveals or scrubs; the hero renders one still frame and the stack stays open.
- No float render targets: the water still moves and reflects, without cursor ripples.
- No WebGL: a CSS pool with a morphing CSS puddle.
- The renderer pauses off-screen, caps canvas pixels, and lowers its resolution if frames run slow.

## Assets

No stock imagery. The logo mark, isometric stack and UI mockups are drawn in code, so they stay sharp and on-palette.
Fonts are self-hosted through Fontsource: **Mona Sans** (display and body) and **Geist Mono** (labels), both SIL Open Font License.

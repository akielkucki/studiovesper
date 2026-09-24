// All site copy lives here so it can be edited without touching layout code.

export const sections = [
  { id: 'intro', label: 'Intro' },
  { id: 'services', label: 'Services' },
  { id: 'benefits', label: 'Benefits' },
  { id: 'process', label: 'Process' },
  { id: 'contact', label: 'Contact' },
]

export const hero = {
  title: ['Websites that', 'win the job.'],
  // On phones the lede is re-broken into a taper, so it is stored as words, not markup.
  lede: [
    { text: 'Web design for local businesses.', strong: true },
    { text: 'We build fast sites that bring in calls — and text back every call you miss, automatically.' },
  ],
  scope: ['Web design', 'Development', 'Missed-call text back'],
}

export const services = [
  {
    name: 'Web design',
    tag: 'What customers see',
    slab: 'DESIGN',
    body: 'A custom site that makes your business look like the obvious choice — built around your services, your area and your reviews. Never a template.',
    includes: ['Custom design', 'Mobile-first layouts', 'Clear calls to action'],
  },
  {
    name: 'Development',
    tag: 'What gets you found',
    slab: 'BUILD',
    body: 'Fast, accessible pages built to show up in local search and load in a blink on mobile data, with a call button always in reach.',
    includes: ['Local search basics', 'Fast on mobile', 'Tap-to-call everywhere'],
  },
  {
    name: 'Missed-call text back',
    tag: 'What catches the call',
    slab: 'TEXT BACK',
    body: "When you can't pick up, the caller gets a text from your business number within seconds — so the job doesn't go to the next company on their list.",
    includes: ['Instant auto-reply', 'Two-way texting', 'Lead alerts'],
  },
]

export const benefits = [
  {
    id: 'ownership',
    title: ['You own', 'your website.'],
    body: 'Your design, your domain, your content. Keep it, change it, move it — no rented templates and no lock-in.',
    demo: 'site',
  },
  {
    id: 'text-back',
    title: ['No missed call', 'goes cold.'],
    body: "Can't answer mid-job? The caller gets a text back within seconds, so the conversation keeps going instead of dying in voicemail.",
    demo: 'sms',
  },
  {
    id: 'conversion',
    title: ['Built to ring', 'your phone.'],
    body: 'Every page has one job: turning a visit into a call. Fast on mobile data, reviews up front, and a call button always in reach.',
    demo: 'checklist',
  },
]

export const steps = [
  {
    title: 'Discover',
    body: 'A short call about your business: what you do, where you work, and where your calls come from today.',
    output: 'Site plan and page list',
  },
  {
    title: 'Design',
    body: 'We design every page around the calls you want more of. You review, we refine, and the design is yours.',
    output: 'Complete site design',
  },
  {
    title: 'Build',
    body: 'We build the site, set up local search basics and connect missed-call text back to your number, then test every call path.',
    output: 'A site ready to launch',
  },
  {
    title: 'Launch',
    body: 'We go live with you, watch the first leads come in, and keep the site fast and up to date as you grow.',
    output: 'Launch and ongoing support',
  },
]

export const inquiry = {
  // Replace with the studio's real inbox before launch.
  email: 'hello@mainstreetlander.com',
  endpoint: '/api/contact',
  industries: ['Home services', 'Auto', 'Health and beauty', 'Food and hospitality', 'Professional services', 'Something else'],
  needs: ['New website', 'Website redesign', 'Missed-call text back', 'Not sure yet'],
}

const CONTACT_PATH = '/api/contact'
const MAX_BODY_BYTES = 16_384
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type ContactSubmission = {
  name: string
  email: string
  business: string
  industry: string
  needs: string[]
  message: string
}

function json(data: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return Response.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      ...extraHeaders,
    },
  })
}

async function readJsonBody(request: Request): Promise<unknown> {
  if (!request.body) throw new Error('EMPTY_BODY')

  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    size += value.byteLength
    if (size > MAX_BODY_BYTES) {
      await reader.cancel()
      throw new Error('BODY_TOO_LARGE')
    }

    chunks.push(value)
  }

  const body = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) {
    body.set(chunk, offset)
    offset += chunk.byteLength
  }

  return JSON.parse(new TextDecoder().decode(body))
}

function parseSubmission(value: unknown): ContactSubmission | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null

  const input = value as Record<string, unknown>
  if (
    typeof input.name !== 'string' ||
    typeof input.email !== 'string' ||
    typeof input.business !== 'string' ||
    typeof input.industry !== 'string' ||
    typeof input.message !== 'string' ||
    !Array.isArray(input.needs) ||
    !input.needs.every((need) => typeof need === 'string')
  ) {
    return null
  }

  const submission = {
    name: input.name.trim(),
    email: input.email.trim(),
    business: input.business.trim(),
    industry: input.industry.trim(),
    needs: input.needs.map((need) => need.trim()).filter(Boolean),
    message: input.message.trim(),
  }

  if (
    !submission.name ||
    !EMAIL_PATTERN.test(submission.email) ||
    submission.name.length > 100 ||
    submission.email.length > 254 ||
    submission.business.length > 120 ||
    submission.industry.length > 100 ||
    submission.needs.length > 10 ||
    submission.needs.some((need) => need.length > 80) ||
    submission.message.length > 1_000
  ) {
    return null
  }

  return submission
}

function discordPayload(submission: ContactSubmission) {
  const valueOrDash = (value: string) => value || '—'

  return {
    username: 'Studio Vesper inquiries',
    allowed_mentions: { parse: [] },
    embeds: [
      {
        title: 'New project inquiry',
        color: 0x242424,
        timestamp: new Date().toISOString(),
        fields: [
          { name: 'Name', value: submission.name, inline: true },
          { name: 'Email', value: submission.email, inline: true },
          { name: 'Business', value: valueOrDash(submission.business), inline: true },
          { name: 'Industry', value: valueOrDash(submission.industry), inline: true },
          { name: 'Needs', value: valueOrDash(submission.needs.join(', ')) },
          { name: 'About the business', value: valueOrDash(submission.message) },
        ],
      },
    ],
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname !== CONTACT_PATH) {
      return new Response('Not found', { status: 404 })
    }

    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed.' }, 405, { Allow: 'POST' })
    }

    const origin = request.headers.get('Origin')
    if (origin && origin !== url.origin) {
      return json({ error: 'Origin not allowed.' }, 403)
    }

    if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) {
      return json({ error: 'Content-Type must be application/json.' }, 415)
    }

    let body: unknown
    try {
      body = await readJsonBody(request)
    } catch (error) {
      const status = error instanceof Error && error.message === 'BODY_TOO_LARGE' ? 413 : 400
      return json({ error: status === 413 ? 'Submission is too large.' : 'Invalid JSON body.' }, status)
    }

    const submission = parseSubmission(body)
    if (!submission) {
      return json({ error: 'Invalid form submission.' }, 400)
    }

    const discordResponse = await fetch(env.DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(discordPayload(submission)),
    })

    if (!discordResponse.ok) {
      console.error('Discord rejected a contact submission.', {
        status: discordResponse.status,
      })
      return json({ error: 'The inquiry could not be delivered.' }, 502)
    }

    return json({ ok: true })
  },
} satisfies ExportedHandler<Env>

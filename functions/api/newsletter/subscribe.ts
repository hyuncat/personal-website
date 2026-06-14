// Cloudflare Pages Function - Newsletter Subscription (single opt-in)
// Adds the subscriber straight to the Brevo list — no confirmation email.
// Runs as a native Cloudflare Worker, no Astro adapter needed.

interface Env {
  BREVO_API_KEY: string
  BREVO_LIST_ID: string
}

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const { email } = await request.json()

    // Validate email
    if (!email || typeof email !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Configuration
    const brevoApiKey = env.BREVO_API_KEY
    const listId = env.BREVO_LIST_ID ? parseInt(env.BREVO_LIST_ID, 10) : null

    if (!brevoApiKey || !listId || isNaN(listId)) {
      console.error('Newsletter not configured: missing BREVO_API_KEY or BREVO_LIST_ID')
      return new Response(
        JSON.stringify({ error: 'Newsletter service is not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Create (or update) the contact and add it directly to the list.
    // updateEnabled: true means an existing contact is updated instead of erroring.
    const brevoResponse = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': brevoApiKey,
      },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        listIds: [listId],
        updateEnabled: true,
      }),
    })

    if (!brevoResponse.ok) {
      // Parse Brevo's error body
      let brevoData: any = {}
      try {
        const text = await brevoResponse.text()
        if (text) brevoData = JSON.parse(text)
      } catch (e) {
        console.error('Failed to parse Brevo error response:', e)
      }

      // Already on the list — treat as success
      if (brevoData?.code === 'duplicate_parameter') {
        return new Response(
          JSON.stringify({ message: 'You are already subscribed to the newsletter', success: true }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      }

      console.error('Brevo API error:', {
        status: brevoResponse.status,
        statusText: brevoResponse.statusText,
        data: brevoData,
      })
      return new Response(
        JSON.stringify({ error: brevoData?.message || 'Failed to subscribe to newsletter' }),
        { status: brevoResponse.status || 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Success — contact added to the list
    return new Response(
      JSON.stringify({ message: 'Successfully subscribed to the newsletter!', success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Newsletter subscription error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'An unexpected error occurred' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

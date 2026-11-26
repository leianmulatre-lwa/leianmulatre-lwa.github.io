// Public read-only search. Forward only the submitted query to Jmail.
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
    const reply = (body, status) => Response.json(body, { status, headers });
    if (request.method !== 'GET' || url.pathname !== '/search') return reply({}, 404);
    const query = (url.searchParams.get('q') || '').trim();
    if (query.length < 2 || query.length > 160) return reply({}, 400);
    try {
      const upstream = new URL('https://jmail.world/api/emails/search');
      upstream.searchParams.set('q', query);
      const response = await fetch(upstream, {signal: AbortSignal.timeout(15000)});
      if (!response.ok) return reply({}, response.status === 429 ? 429 : 502);
      const {results} = await response.json();
      if (!Array.isArray(results)) return reply({}, 502);
      return reply(results.slice(0,20).filter(row => row.thread?.doc_id).map(({thread,matchedEmail}) => ({
        subject: thread.subject || '(No subject)', date: thread.formatted_date || '',
        text: String(matchedEmail?.content_markdown || '').slice(0,16000),
        link: 'https://jmail.world/thread/' + encodeURIComponent(thread.doc_id)
      })), 200);
    } catch { return reply({}, 503); }
  }
};

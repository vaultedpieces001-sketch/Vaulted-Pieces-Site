// Proxies SMS signups to Postscript's Subscriber API.
// Keeps the private API key server-side only — never expose it in client JS.
// Requires two environment variables set in Netlify (Site settings → Environment variables):
//   POSTSCRIPT_API_KEY  — your Private API Key from https://app.postscript.io/account/api
//   POSTSCRIPT_KEYWORD   — the keyword text of an "OPT IN" keyword you create in Postscript's Keywords section

function toE164(rawPhone) {
  const digits = rawPhone.replace(/\D/g, '');

  if (rawPhone.trim().startsWith('+')) return `+${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  return `+${digits}`;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let phone;
  try {
    ({ phone } = JSON.parse(event.body));
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body' }) };
  }

  if (!phone || !phone.trim()) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Phone number is required' }) };
  }

  const apiKey = process.env.POSTSCRIPT_API_KEY;
  const keyword = process.env.POSTSCRIPT_KEYWORD;

  if (!apiKey || !keyword) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Server not configured — missing Postscript environment variables' }) };
  }

  try {
    const response = await fetch('https://api.postscript.io/api/v2/subscribers', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone_number: toE164(phone),
        keyword,
        origin: 'website',
      }),
    });

    const rawText = await response.text();
    let data = {};
    try { data = JSON.parse(rawText); } catch { /* leave data empty, use rawText below */ }

    if (!response.ok) {
      console.error('Postscript API error', response.status, rawText);
      return {
        statusCode: response.status,
        body: JSON.stringify({
          error: data.message || data.error || data.detail || rawText || 'Postscript rejected the request',
        }),
      };
    }

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    return { statusCode: 502, body: JSON.stringify({ error: 'Could not reach Postscript' }) };
  }
};

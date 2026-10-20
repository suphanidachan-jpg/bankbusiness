const crypto = require('crypto');

async function rawBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(typeof c === 'string' ? Buffer.from(c) : c);
  return Buffer.concat(chunks);
}

function verify(raw, header, secret) {
  if (!header || !secret) return false;
  const parts = {};
  header.split(',').forEach((kv) => { const i = kv.indexOf('='); parts[kv.slice(0, i)] = parts[kv.slice(0, i)] || kv.slice(i + 1); });
  const t = parts.t, v1 = header.split(',').filter((x) => x.startsWith('v1=')).map((x) => x.slice(3));
  if (!t || !v1.length) return false;
  if (Math.abs(Date.now() / 1000 - Number(t)) > 300) return false;
  const expected = crypto.createHmac('sha256', secret).update(t + '.' + raw.toString('utf8')).digest('hex');
  return v1.some((s) => s.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected)));
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  const raw = await rawBody(req);
  if (!verify(raw, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET)) {
    return res.status(400).send('bad signature');
  }
  const event = JSON.parse(raw.toString('utf8'));
  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
    const s = event.data.object;
    if (s.payment_status === 'paid') {
      try {
        const r = await fetch(process.env.SHEET_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'paid', secret: process.env.SHEET_SECRET,
            ref: s.client_reference_id, sessionId: s.id,
            amount: (s.amount_total || 0) / 100
          })
        });
        const j = await r.json();
        if (!j.ok) return res.status(500).send('sheet error'); // ให้ Stripe ส่งซ้ำ
      } catch (e) {
        return res.status(500).send('sheet error');
      }
    }
  }
  return res.status(200).json({ received: true });
};

const crypto = require('crypto');

const PRICE_SATANG = 79950 * 100; // 79,950 บาท ต่อที่นั่ง (กำหนดฝั่งเซิร์ฟเวอร์เท่านั้น)
const MAX_SEATS = 50;

const clean = (v) => String(v == null ? '' : v).trim().slice(0, 200);

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  let p = req.body;
  if (typeof p === 'string') { try { p = JSON.parse(p); } catch (e) { p = {}; } }
  p = p || {};
  if (p.website) return res.status(200).json({ ok: true }); // honeypot

  const name = clean(p.name), phone = clean(p.phone), email = clean(p.email);
  const company = clean(p.company), position = clean(p.position);
  const seats = parseInt(p.seats, 10);
  if (!name || !phone || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ||
      !(seats >= 1 && seats <= MAX_SEATS) || p.ack !== true) {
    return res.status(400).json({ error: 'invalid' });
  }

  const ref = crypto.randomUUID();
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const site = (process.env.SITE_URL || ('https://' + host)).replace(/\/$/, '');

  // 1) บันทึกลง Google Sheet สถานะ PENDING (ยังไม่ใช่การจอง)
  try {
    const r = await fetch(process.env.SHEET_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'pending', secret: process.env.SHEET_SECRET, ref,
        name, company, position, phone, email, seats,
        marketing: p.marketing === true,
        consentVersion: clean(p.consentVersion), utm: clean(p.utm)
      })
    });
    const j = await r.json();
    if (!j.ok) throw new Error('sheet');
  } catch (e) {
    return res.status(502).json({ error: 'sheet' });
  }

  // 2a) ยังไม่มี Stripe key -> ส่งลูกค้าไป Payment Link ที่สร้างไว้ (ผูกด้วยรหัสอ้างอิง ไม่ใส่ข้อมูลส่วนตัวใน URL)
  if (!process.env.STRIPE_SECRET_KEY) {
    const link = process.env.PAYMENT_LINK || 'https://buy.stripe.com/eVqaEWbyrfojg3udHsg360j';
    return res.status(200).json({ url: link + '?client_reference_id=' + encodeURIComponent(ref) });
  }

  // 2) สร้างหน้าชำระเงินของ Stripe (ช่องทางที่แสดงตามที่เปิดใน Stripe Dashboard)
  const f = new URLSearchParams();
  f.set('mode', 'payment');
  f.set('locale', 'th');
  f.set('allow_promotion_codes', 'true');
  f.set('customer_email', email);
  f.set('client_reference_id', ref);
  f.set('metadata[ref]', ref);
  f.set('line_items[0][quantity]', String(seats));
  f.set('line_items[0][price_data][currency]', 'thb');
  f.set('line_items[0][price_data][unit_amount]', String(PRICE_SATANG));
  f.set('line_items[0][price_data][product_data][name]', 'B.A.N.K. BUSINESS 2 Days Intensive (28–29 พ.ย. 2569)');
  f.set('success_url', site + '/thanks.html?session_id={CHECKOUT_SESSION_ID}');
  f.set('cancel_url', site + '/#book');

  try {
    const r = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + process.env.STRIPE_SECRET_KEY,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Idempotency-Key': ref
      },
      body: f.toString()
    });
    const s = await r.json();
    if (!r.ok || !s.url) return res.status(502).json({ error: 'stripe' });
    return res.status(200).json({ url: s.url });
  } catch (e) {
    return res.status(502).json({ error: 'stripe' });
  }
};

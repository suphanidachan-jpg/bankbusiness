module.exports = async (req, res) => {
  const id = String((req.query && req.query.id) || '');
  if (!/^cs_[A-Za-z0-9_]+$/.test(id)) return res.status(400).json({ paid: false });
  try {
    const r = await fetch('https://api.stripe.com/v1/checkout/sessions/' + id, {
      headers: { Authorization: 'Bearer ' + process.env.STRIPE_SECRET_KEY }
    });
    const s = await r.json();
    if (!r.ok) return res.status(404).json({ paid: false });
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ paid: s.payment_status === 'paid', amount: (s.amount_total || 0) / 100 });
  } catch (e) {
    return res.status(502).json({ paid: false });
  }
};

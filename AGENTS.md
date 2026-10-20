# B.A.N.K. BUSINESS landing page

Thai-language sales page for the "B.A.N.K. BUSINESS 2 Days Intensive" course (Chana Consultant), with booking via Stripe Checkout.

**Read [HANDOFF.md](HANDOFF.md) before changing the page.** It has recent changes, the reasons behind them, and decisions still waiting on the owner.

## Files

| Path | Role |
|---|---|
| `index.html` | The live page, served at `/`. Self-contained, about 5.6 MB: fonts and images are base64-inlined, all CSS is in one `<style>` and all JS in one `<script>` at the end. |
| `thanks.html` | Stripe `success_url`. Calls `/api/session` to show the payment status. |
| `api/checkout.js` | Booking form → PENDING row in a Google Sheet → Stripe Checkout session → returns `{url}`. The price and the seat cap are set here, server-side. |
| `api/webhook.js` | Stripe webhook. Marks the sheet row as paid. |
| `api/session.js` | Payment-status lookup for `thanks.html`. |
| `BB_Landing_index.html` | An earlier copy of the page. Make changes in `index.html`. |

The functions use the Vercel-style `module.exports = async (req, res)` signature. Secrets come from environment variables (`grep -o "process.env.[A-Z_]*" api/*.js`). There is no build step, no package dependencies and no test suite.

## Editing index.html

Some single lines in this file are longer than 1.7 million characters (base64), which breaks normal editors and file-reading tools.

- **Look by searching.** Grep for nearby visible text, then print a window around the match with the base64 removed, for example in Python: `re.sub(r'data:[^;]+;base64,[A-Za-z0-9+/=]+', 'DATA', html)`.
- **Edit with a small script.** Do an exact string replacement and assert that the old string occurs exactly once. The same style strings repeat all over the page, so a loose match can hit the wrong element. Read and write the file as UTF-8 bytes and keep its CRLF line endings.
- **Match the serialized markup.** Attributes are in alphabetical order, every element has a `style=""`, and the style attribute uses single quotes (`style='…'`) when its value contains double quotes.
- **Styles:**
  - Static layout lives in inline `style` attributes.
  - Anything stateful (`:hover`, `:focus-visible`, `::before`, `@keyframes`) is a class in the single `<style>` block. Component CSS sits at the end of that block, after the `@font-face` rules.
  - Inline styles outrank the stylesheet, so a hover rule that changes an inline `box-shadow` or `background` needs `!important`.
- **Motion:**
  - Hover effects go inside `@media (hover:hover)`, so phones don't keep a stuck hover state after a tap.
  - Every animation is also turned off in the page's single `@media (prefers-reduced-motion:reduce)` rule. Add new entries to that rule.
- **Script:** ES5 (`var`, `function`), one feature per line in the final `<script>`, no libraries.
- **Fonts:** only the embedded weights render: Inter 400/600/700/800 and Noto Sans Thai 400–800.
- **Brand colours:**
  - navy `#032B59`, with the button gradient running from `#0A3D75` to `#032B59`
  - deep navy `#021E3F`
  - gold `#FFB21A` / `#FFC24D`
  - LINE green `#21B94E`
- **Layout:** a single mobile column, with `main` at a max-width of 480px. Check every change at 480px and 390px wide.

## Content rules

- **Urgency elements:** they state only facts the owner has supplied, namely the seats left and the start time. Seat totals, "% booked" figures or "viewing now" counters need real numbers from the owner.
- **Facts repeated across files** must be updated together:
  - Price 79,950 บาท: page text, and `PRICE_SATANG` in `api/checkout.js`.
  - Course date 28–29 พ.ย. 2569: page text, `data-countdown` on the urgency card, and the product name in `api/checkout.js`.
  - Seats left: `.fomo-num` and the text around it on the urgency card.

## Interactive hooks

| Selector | What it is |
|---|---|
| `.btn` + `.btn-primary` / `-light` / `-outline` / `-line` (+ `.btn-on-dark`) | Buttons with hover, press and focus states. `.btn-on-dark` gives a white focus outline on navy backgrounds. |
| `[data-submit]` | Booking-form submit → `POST /api/checkout`. While sending it sets inline `opacity` and `pointer-events`. |
| `[data-act="share"]`, `#sharesheet`, `.ss-*` | Share button: the native share sheet on touch devices with `navigator.share`, otherwise the bottom share panel. |
| `.fomo*`, `[data-countdown]` | "5 ที่นั่งสุดท้าย" urgency card and its live countdown. |
| `.curr`, `.cc-track`, `.cc`, `.cc-dot`, `.cc-nav`, `[data-go]` | Curriculum swipe cards. An IntersectionObserver adds `.curr.play` only while the section is on screen. |
| `.ic3d`, `.i-*` | Animated 3D SVG icons. The `.i-*` classes are the moving parts. |
| `.ph` | Gallery photo hover. |
| `.faq` / `.fq` / `.fa` | FAQ accordion. |
| `#privacy` | Privacy notice (`<details>`). |

## Verifying a change

Check changes in headless Chrome over the DevTools Protocol. Node 22's built-in `fetch` and `WebSocket` are enough, so nothing needs installing.

1. Launch Chrome:
   ```
   chrome --headless=new --remote-debugging-port=<port> --user-data-dir=<tmp dir>
   ```
2. For each check:
   - set the viewport with `Emulation.setDeviceMetricsOverride` (width 480 or 390, `deviceScaleFactor: 2`);
   - load the file URL with `Page.navigate`;
   - take a picture with `Page.captureScreenshot`.
3. For hover states, send `Input.dispatchMouseEvent` with `type: 'mouseMoved'`.
4. For the touch / `pointer:coarse` path, set `mobile: true` and call `Emulation.setTouchEmulationEnabled`.

Two gotchas:

- **Smooth scrolling:** the page sets `html{scroll-behavior:smooth}`. Call `scrollIntoView({behavior:'instant'})` before measuring or hovering, or the measurements are taken mid-scroll.
- **Share APIs:** `navigator.share` and `navigator.clipboard` only exist in a secure context. Stub them with `Object.defineProperty(navigator, …)` to test each share branch.

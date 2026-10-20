# Handoff: 2026-10-20

This is the state of the page after the UI pass on branch `Feature_UI_enhance` (PR into `main`). Rewrite or delete this file once the open items are settled.

## What changed (commit `409ef50`)

Everything is in `index.html`. The checkout flow, `api/` and `thanks.html` were not touched.

- **Buttons, FAQ rows and the privacy toggle:** hover, press and keyboard-focus states.
- **Broken CTAs:** two "จองที่นั่ง" buttons had no `href` and did nothing. They now go to `#book`.
- **Hero:**
  - The speaker photo is 40% bigger (602px tall), pinned to the top and cropped at the hips.
  - The hero text is aligned with the info-card text (33px from the edge).
  - The orange "300%" line has a soft shadow so it stays readable over the photo.
- **LINE:** the outlined boxes in the hero and the booking form are now green "ติดต่อสอบถามผ่าน LINE" buttons linking to `https://page.line.me/732xgjgm?oat_content=url&openQrModal=true`.
- **"5 ที่นั่งสุดท้าย":** now an urgency card with 3D seats, a pulsing "5" and a live countdown to `2026-11-28T09:00:00+07:00`. The countdown hides itself once the course starts.
- **Share:**
  - A standard share icon.
  - On touch devices it opens the native share sheet. Otherwise it opens the `#sharesheet` panel: LINE, Facebook, อีเมล, คัดลอกลิงก์.
  - The separate copy-link button was removed.
- **Gallery photos:** zoom, lift and a light sweep on hover.
- **Curriculum:**
  - Animated 3D icons.
  - The 7-row list became swipe cards with dots, ‹ › arrows and a "ถัดไป" button.
  - The last card's CTA goes to `#book`.

## Decisions and why

Keep these unless the owner says otherwise.

- **Animated SVG instead of GIF files.** Inline SVG with CSS animation stays sharp at any screen density and costs a few KB. Seven GIFs would add hundreds of KB to a page that is already 5.6 MB.
- **Urgency card facts.** It uses only the real seat count and start time.
- **Module 4 icon.** It is a dart hitting a target (it was a handshake). It reads as "closing deals / hitting sales targets" and animates better.
- **Copy link.** It lives inside the share panel, because the owner asked to remove the separate button.
- **Equal card heights.** Curriculum cards all share the tallest card's height, with a footer pinned to the bottom, so the dots and arrows never move while swiping.
- **LINE green.** `#21B94E` was the owner's choice. White text on it has a contrast ratio of 2.6:1.

## Open items (need the owner)

1. **LINE link mismatch.** The big buttons use the new `page.line.me/732xgjgm` link. These still use `https://lin.ee/RaYuyrR`:
   - in `index.html`: the form error message, the privacy notice (twice) and the footer;
   - in `thanks.html`: two places.

   Confirm which link is correct, then update all of them.
2. **Seat-limit mismatch (bug from before this pass).** The form allows 1–50 seats (`max="50"`), but `api/checkout.js` rejects more than 10 (`MAX_SEATS = 10`), and the visitor only sees a generic "ส่งข้อมูลไม่สำเร็จ". Decide on one limit and use it in both places.
3. **Info-card values bold or regular?** A preview with all four values (date, format, venue, time) at weight 400 was made but not applied.
4. **LINE button contrast.** Navy text, or a darker green, would meet WCAG AA.
5. **`BB_Landing_index.html`.** It was not updated. Confirm whether it is still used, then delete it or bring it in line with `index.html`.
6. **Unused placeholder.** `var ENDPOINT='__SHEET_ENDPOINT__'` in the script of `index.html` is never read; the sheet is written server-side through `SHEET_ENDPOINT`. It can be removed.
7. **Curriculum layout.** A gold-line timeline and an expand/collapse list were also proposed; the owner picked the carousel. With the carousel, modules 2–7 are only visible after swiping.

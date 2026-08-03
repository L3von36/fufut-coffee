# UI/UX Audit Report — Fu Fut Coffee

This report outlines the UI/UX, consistency, accessibility, and interactive state issues found in the Fu Fut Coffee project across all phases.

---

## 1. UI Consistency & Styling

### 1.1 Inconsistent Spacing & Rhythm
- In `index.html`, inline style definitions contain standard tokens (e.g., `--space-1` through `--space-8` and `--s-1` through `--s-10` in `styles.css`), but many elements mix custom pixel margins and padding with CSS variables.
- Modals on mobile devices have negative margins (`margin-top: calc(-1 * var(--space-5));`) that can cause vertical rhythm breakdowns on extra-small viewports.

### 1.2 Inconsistent Typography & Color Contrast
- The gold/accent color (`--gold-300`, `--gold-500`, `--gold-700`) has extremely poor readability on light backgrounds (such as light gray sections or white cards/headers).
- When the navbar is scrolled (`.nav.scrolled`), the logo and links fade to white/teal but have contrast issues on certain screen sections if background elements bleed through.
- No `:focus-visible` styling is defined for many of the custom buttons, and focus indicators default to the generic browser outline or are completely hidden.

---

## 2. UX Problems & CONFUSING Interactions

### 2.1 Unclear Actions & Feedback
- The "Add to Order" action in the detail modal has limited feedback other than changing the text to "Added!" and a short delay before automatically closing.
- When an item is out of stock or unavailable, the user can still click "Order", which only shows a toast message instead of being visually disabled or inoperative in the first place.

### 2.2 Form & Keyboard Accessibility Gaps
- Interactive forms (Reservation, Review, and Checkout fields in Cart) lack proper standard HTML `autocomplete` attributes, leading to a degraded autofill experience on mobile/desktop browsers.
- Keyboard navigation is broken in the Lightbox and Detail Modals:
  - Focus is not trapped inside the modals/drawers when they are open.
  - Interactive close buttons lack clear focus indicators.

### 2.3 Poor Empty and Error States
- If the menu load fails (e.g., Worker/KV failure), the menu grid shows an infinite skeleton shimmer loading state with no retry button or helpful feedback.
- If a user filters the menu (e.g., selecting "🌱 Vegan") and there are no matching items, the grid is left completely blank without any empty/no-results state.

---

## 3. Button & Interactive State Issues

- Many icons, such as the modal close button, have touch targets smaller than the mobile-recommended 44x44px.
- Focus-visible rings are missing or inconsistent on many interactive buttons.
- Duplicate form submission prevention is only handled in some scripts, with other submit buttons remaining fully active and clickable while async fetch actions are running.

---

## 4. Accessibility Barriers (Phase 6)

- Modal elements, the cart drawer, and the mobile navigation drawer lack proper ARIA role attributes (`role="dialog"`, `aria-modal="true"`).
- Structural semantic HTML headings sometimes jump levels or lack appropriate screen-reader readable text where visual labels use icons only.
- Keyboard navigation is missing standard focus-visible styling on many elements.

---

## 5. Responsive Design Flaws (Phase 7)

- Wide/Ultra-wide displays let certain columns stretch excessively, harming visual hierarchy and text line lengths.
- On some viewport widths (e.g., small tablets or large phones), text wraps awkwardly inside cards and columns, occasionally causing overflowing content.

# CNC Invitation — Mobile Screen Notes

This document is the mobile-first reference for `cnc.html`. Keep it in sync with the styles and components.

## Viewport & safe areas

- `<meta name="viewport" content="width=device-width, initial-scale=1">` is set.
- Safe-area insets are applied to fixed overlays (`rsvp-overlay`) and the floating music button so notched phones keep controls reachable.
- `100vh` fallbacks precede `100svh` / `100dvh` units so older iPhones still render full-height media, while newer browsers account for dynamic toolbars.
- The envelope video uses inline playback, an explicit MP4 source type, and an initial media fragment so iOS Safari can display its first frame.

## Breakpoints

- **Small phones:** `@media (max-width: 520px)` tweaks spacing, panel height (`52svh`), code box width, and schedule flower size.
- **Page-one GIF:** fills one complete viewport at every screen size; the remaining panels keep their existing dimensions.

## Fluid sizing

- Type uses `clamp()` so it scales from phones to desktops without extra breakpoints.
- Panels use `min()` for max widths and `clamp()` for padding.

## Touch & inputs

- All buttons and inputs have `touch-action: manipulation` to remove the 300 ms double-tap delay.
- The access code input uses `inputmode="numeric"` + `pattern="[0-9]*"` to raise the number keypad.
- The access code input remains at least 16px and is blurred after validation so iPhone Safari does not leave the invitation zoomed in.
- Tap highlights are removed via `-webkit-tap-highlight-color: transparent`.
- Hover effects are wrapped in `@media (hover: hover)` so they don't stick after a tap on touch screens.

## Accessibility

- `prefers-reduced-motion: reduce` shortens transitions/animations.
- Form fields have labels and `aria-live` / `aria-expanded`.

## Quick test checklist

- [ ] iOS Safari / Chrome Android: gate video fills screen, code input visible.
- [ ] Numeric keyboard appears for the 3-digit code.
- [ ] RSVP popup stays clear of notch in landscape.
- [ ] Tapping RSVP options doesn't leave a grey hover state.
- [ ] Music button reachable above home indicator.
- [ ] Reduced-motion setting is respected.

# Last Context

## State
- **Branch**: `task/nav-gold-buttons`
- **Task**: Unified navbar button shape and metallic gold styling across the application.
- **Key changes**:
  - Replaced pill shape (`border-radius: 999px`) in Andes and Recorrido with the rounded-rectangle form from the Simulador (`border-radius: var(--radius-md)` / 8px).
  - Shifted gold palette in `tokens.css` from yellow/olive tone to a warm radiant gold (`#dfa73f`), with champagne highlight (`#fae4b8`), amber body (`#b87f22`), and bronze shadow (`#85530d`).
  - Styled active buttons in Andes, Recorrido, Simulador, and Data with dark glass, warm gold borders, champagne gold text (`var(--gold-highlight)`), and golden ambient glow.
  - Gave the logo "2056" (`.brand-n`) a polished metallic gradient with warm gold drop shadow instead of flat yellow text.
  - Verified in browser with DevTools screenshots and all unit tests passed.

## Next
- Human review of the refined gold palette and button shapes in the browser.
- Open PR for `task/nav-gold-buttons`.

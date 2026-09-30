import type { Engine } from 'excalibur';

/**
 * Taps/clicks as discrete presses.
 *
 * Excalibur's `pointers.wasDown()` reports whether a pointer was *held* on the
 * previous frame, so a quick tap (down + up between frames) is easy to miss.
 * Listening for `down` events and consuming them once per frame is reliable.
 */
let pending = false;

export function listenForTaps(engine: Engine) {
  engine.input.pointers.primary.on('down', () => {
    pending = true;
  });
}

/** True once per tap. Call every frame you care about so stale taps don't linger. */
export function consumeTap(): boolean {
  const tapped = pending;
  pending = false;
  return tapped;
}

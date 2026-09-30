import type { Engine } from 'excalibur';
import { soundManager } from '../audio/SoundManager';
import { consumeTap } from '../systems/TapInput';

const ICONS = {
  soundOn:
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>',
  soundOff:
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 9l5 6M22 9l-5 6"/></svg>',
  pause:
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>',
  play: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M8 5l11 7-11 7z"/></svg>',
};

/**
 * Mute + pause, as keyboard shortcuts (M, P/Esc) and on-screen buttons for touch.
 * Pausing stops the engine clock; the clock clamps long gaps, so resuming
 * doesn't fast-forward. Also pauses when the tab is hidden mid-run.
 */
export function mountControls(engine: Engine, canPause: () => boolean) {
  const bar = document.createElement('div');
  bar.id = 'controls';

  const muteBtn = document.createElement('button');
  const pauseBtn = document.createElement('button');
  for (const b of [muteBtn, pauseBtn]) b.type = 'button';
  bar.append(muteBtn, pauseBtn);

  const overlay = document.createElement('button');
  overlay.type = 'button';
  overlay.id = 'pause-overlay';
  overlay.hidden = true;
  overlay.innerHTML = '<span class="title">Paused</span><span class="sub">Press P or tap to keep running</span>';
  overlay.setAttribute('aria-label', 'Paused. Resume');

  document.body.append(bar, overlay);

  let paused = false;
  let lastKey = '';

  const render = () => {
    const key = `${soundManager.muted}|${paused}|${canPause()}`;
    if (key === lastKey) return; // only touch the DOM when something changed
    lastKey = key;
    muteBtn.innerHTML = soundManager.muted ? ICONS.soundOff : ICONS.soundOn;
    muteBtn.setAttribute('aria-label', soundManager.muted ? 'Unmute sound (M)' : 'Mute sound (M)');
    muteBtn.setAttribute('aria-pressed', String(soundManager.muted));
    pauseBtn.innerHTML = paused ? ICONS.play : ICONS.pause;
    pauseBtn.setAttribute('aria-label', paused ? 'Resume (P)' : 'Pause (P)');
    pauseBtn.hidden = !paused && !canPause();
    overlay.hidden = !paused;
  };

  const setPaused = (next: boolean) => {
    if (next === paused || (next && !canPause())) return;
    paused = next;
    if (paused) {
      engine.clock.stop();
    } else {
      consumeTap(); // taps made while paused shouldn't turn into a jump
      engine.clock.start();
      engine.canvas.focus();
    }
    render();
  };

  const toggleMute = () => {
    soundManager.setMuted(!soundManager.muted);
    render();
  };

  muteBtn.addEventListener('click', toggleMute);
  pauseBtn.addEventListener('click', () => setPaused(!paused));
  overlay.addEventListener('click', () => setPaused(false));

  window.addEventListener('keydown', (e) => {
    if ((e.target as HTMLElement | null)?.closest?.('input, textarea')) return;
    if (e.code === 'KeyM') toggleMute();
    // Not Space: the same press would also register as a jump on the first resumed frame
    else if (e.code === 'KeyP' || (e.code === 'Escape' && paused)) setPaused(!paused);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) setPaused(true);
  });

  // The pause button only makes sense mid-run; refresh it as scenes change
  setInterval(render, 250);
  render();
}

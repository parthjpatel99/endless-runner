export function showNameInput(): Promise<string> {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.id = 'name-input-overlay';
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      display: flex; align-items: center; justify-content: center;
      z-index: 1000; background: rgba(20,17,14,0.6);
    `;

    const box = document.createElement('div');
    box.style.cssText = `
      background: #1d1915; border: 1px solid #463c33; border-radius: 18px;
      padding: 28px 32px; text-align: center; font-family: "IBM Plex Mono", ui-monospace, monospace;
      box-shadow: 0 30px 60px -20px rgba(0,0,0,0.6);
    `;

    const label = document.createElement('div');
    label.textContent = 'New world record. Sign the map:';
    label.style.cssText = 'color: #ffc15e; font-size: 13px; letter-spacing: 0.08em; margin-bottom: 14px; text-transform: uppercase;';

    const input = document.createElement('input');
    input.type = 'text';
    input.maxLength = 20;
    input.placeholder = 'Anonymous';
    input.setAttribute('aria-label', 'Your name for the world record');
    input.style.cssText = `
      background: #14110e; color: #f1e9dc; border: 1px solid #463c33; border-radius: 999px;
      padding: 10px 16px; font-size: 16px; font-family: "IBM Plex Mono", ui-monospace, monospace;
      text-align: center; outline: none; width: 220px;
    `;

    const btn = document.createElement('button');
    btn.textContent = 'SUBMIT';
    btn.style.cssText = `
      display: block; margin: 14px auto 0; background: #ff8a3d; color: #14110e;
      border: none; border-radius: 999px; padding: 12px 28px; font-size: 14px;
      font-family: "IBM Plex Mono", ui-monospace, monospace; font-weight: 500; cursor: pointer;
    `;

    function submit() {
      const name = input.value.trim().replace(/[^a-zA-Z0-9 ]/g, '') || 'Anonymous';
      overlay.remove();
      resolve(name);
    }

    btn.addEventListener('click', submit);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submit();
      e.stopPropagation(); // prevent game from capturing keystrokes
    });
    // Prevent all key events from reaching the game canvas
    overlay.addEventListener('keydown', (e) => e.stopPropagation());
    overlay.addEventListener('keyup', (e) => e.stopPropagation());

    box.appendChild(label);
    box.appendChild(input);
    box.appendChild(btn);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    input.focus();
  });
}

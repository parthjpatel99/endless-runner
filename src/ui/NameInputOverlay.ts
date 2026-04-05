export function showNameInput(): Promise<string> {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.id = 'name-input-overlay';
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      display: flex; align-items: center; justify-content: center;
      z-index: 1000; background: rgba(0,0,0,0.5);
    `;

    const box = document.createElement('div');
    box.style.cssText = `
      background: #0a0a1e; border: 2px solid #ffd60a; border-radius: 8px;
      padding: 24px; text-align: center; font-family: "Orbitron", monospace;
    `;

    const label = document.createElement('div');
    label.textContent = 'Enter your name:';
    label.style.cssText = 'color: #ffd60a; font-size: 16px; margin-bottom: 12px;';

    const input = document.createElement('input');
    input.type = 'text';
    input.maxLength = 20;
    input.placeholder = 'Anonymous';
    input.style.cssText = `
      background: #111; color: #00f5d4; border: 1px solid #00f5d4; border-radius: 4px;
      padding: 8px 12px; font-size: 16px; font-family: "Orbitron", monospace;
      text-align: center; outline: none; width: 200px;
    `;

    const btn = document.createElement('button');
    btn.textContent = 'SUBMIT';
    btn.style.cssText = `
      display: block; margin: 12px auto 0; background: #ffd60a; color: #0a0a1e;
      border: none; border-radius: 4px; padding: 8px 24px; font-size: 14px;
      font-family: "Orbitron", monospace; font-weight: bold; cursor: pointer;
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

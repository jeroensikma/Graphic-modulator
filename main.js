// Modulator registry — builds the tab bar and manages active instance lifecycle.

const MODULATORS = [noiseModulator, mosaicModulator];

const tabBar    = document.getElementById('modulator-tabs');
const canvasEl  = document.getElementById('canvas-wrapper');
const controlsEl = document.getElementById('controls');

let active = null;

function switchTo(mod) {
  if (active === mod) return;
  if (active) active.destroy();

  // Clear containers before handing them to the new modulator
  canvasEl.innerHTML   = '';
  controlsEl.innerHTML = '';

  active = mod;
  mod.init(canvasEl, controlsEl);
}

MODULATORS.forEach((mod, i) => {
  const btn = document.createElement('button');
  btn.className   = 'tab-btn';
  btn.textContent = mod.name;

  btn.addEventListener('click', () => {
    [...tabBar.querySelectorAll('.tab-btn')].forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    switchTo(mod);
  });

  if (i === 0) btn.classList.add('active');
  tabBar.appendChild(btn);
});

switchTo(MODULATORS[0]);

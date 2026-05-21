// Modulator registry — populates the dropdown and manages active instance lifecycle.

const MODULATORS = [noiseModulator, mosaicModulator];

const select     = document.getElementById('modulator-select');
const canvasEl   = document.getElementById('canvas-wrapper');
const controlsEl = document.getElementById('controls');

let active = null;

function switchTo(mod) {
  if (active === mod) return;
  if (active) active.destroy();

  canvasEl.innerHTML   = '';
  controlsEl.innerHTML = '';

  active = mod;
  mod.init(canvasEl, controlsEl);
}

MODULATORS.forEach((mod, i) => {
  const opt = document.createElement('option');
  opt.value       = i;
  opt.textContent = mod.name;
  select.appendChild(opt);
});

select.addEventListener('change', () => {
  switchTo(MODULATORS[select.value]);
});

switchTo(MODULATORS[0]);

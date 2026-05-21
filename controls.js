// Registry of all modulatable parameters.
// Each entry defines the slider label, range, default, step, and a display formatter.
const PARAMS = {
  cols:       { label: 'Columns',     min: 4,    max: 40,   value: 16,   step: 1,    fmt: v => Math.round(v) },
  noiseScale: { label: 'Noise Scale', min: 0.002,max: 0.08, value: 0.02, step: 0.001,fmt: v => v.toFixed(3) },
  speed:      { label: 'Speed',       min: 0,    max: 0.04, value: 0.008,step: 0.001,fmt: v => v.toFixed(3) },
  twist:      { label: 'Twist',       min: 0,    max: 6.283, value: 1.2, step: 0.01, fmt: v => v.toFixed(2) },
  strokeW:    { label: 'Stroke',      min: 0.2,  max: 4,    value: 1,    step: 0.1,  fmt: v => v.toFixed(1) },
  brightness: { label: 'Brightness',  min: 80,   max: 255,  value: 200,  step: 1,    fmt: v => Math.round(v) },
};

(function buildControls() {
  const container = document.getElementById('controls');

  for (const [key, cfg] of Object.entries(PARAMS)) {
    const wrapper = document.createElement('div');
    wrapper.className = 'control';

    const label = document.createElement('label');
    label.textContent = cfg.label;

    const valueSpan = document.createElement('span');
    valueSpan.textContent = cfg.fmt(cfg.value);
    label.appendChild(valueSpan);

    const slider = document.createElement('input');
    slider.type  = 'range';
    slider.min   = cfg.min;
    slider.max   = cfg.max;
    slider.step  = cfg.step;
    slider.value = cfg.value;

    slider.addEventListener('input', () => {
      cfg.value = parseFloat(slider.value);
      valueSpan.textContent = cfg.fmt(cfg.value);
    });

    wrapper.appendChild(label);
    wrapper.appendChild(slider);
    container.appendChild(wrapper);
  }
})();

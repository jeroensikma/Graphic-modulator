// Shared utility — call once per modulator init.
// Appends a labeled range slider for each entry in `params` to `container`.
// Each param entry: { label, min, max, value, step, fmt }
// Mutates param.value live via the slider's input event.
function buildControls(params, container) {
  for (const [, cfg] of Object.entries(params)) {
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
}

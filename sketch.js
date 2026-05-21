// Noise Field modulator — grid of cross+diamond tiles driven by Perlin noise.

const noiseModulator = {
  name: 'Noise Field',
  _p5: null,

  init(canvasEl, controlsEl) {
    const PARAMS = {
      cols:       { label: 'Columns',     min: 4,    max: 40,   value: 16,   step: 1,    fmt: v => Math.round(v) },
      noiseScale: { label: 'Noise Scale', min: 0.002,max: 0.08, value: 0.02, step: 0.001,fmt: v => v.toFixed(3) },
      speed:      { label: 'Speed',       min: 0,    max: 0.04, value: 0.008,step: 0.001,fmt: v => v.toFixed(3) },
      twist:      { label: 'Twist',       min: 0,    max: 6.283,value: 1.2,  step: 0.01, fmt: v => v.toFixed(2) },
      strokeW:    { label: 'Stroke',      min: 0.2,  max: 4,    value: 1,    step: 0.1,  fmt: v => v.toFixed(1) },
      brightness: { label: 'Brightness',  min: 80,   max: 255,  value: 200,  step: 1,    fmt: v => Math.round(v) },
    };

    buildControls(PARAMS, controlsEl);

    this._p5 = new p5((p) => {
      let t = 0;

      p.setup = () => {
        const size = Math.min(window.innerWidth - 48, 712);
        const cvs  = p.createCanvas(size, size);
        cvs.parent(canvasEl);
        p.colorMode(p.HSB, 360, 100, 100, 100);
        p.strokeCap(p.ROUND);
        p.noFill();
      };

      p.draw = () => {
        p.background(0, 0, 6);

        const cols  = Math.round(PARAMS.cols.value);
        const ns    = PARAMS.noiseScale.value;
        const twist = PARAMS.twist.value;
        const sw    = PARAMS.strokeW.value;
        const bri   = p.map(PARAMS.brightness.value, 80, 255, 30, 100);
        const tileW = p.width  / cols;
        const tileH = p.height / cols;

        for (let row = 0; row < cols; row++) {
          for (let col = 0; col < cols; col++) {
            const cx = (col + 0.5) * tileW;
            const cy = (row + 0.5) * tileH;

            const n1 = p.noise(col * ns, row * ns, t);
            const n2 = p.noise(col * ns + 100, row * ns + 100, t * 0.7);
            const n3 = p.noise(col * ns + 200, row * ns + 200, t * 1.3);

            const angle = n1 * twist * p.TWO_PI;
            const scale = p.map(n2, 0, 1, 0.15, 0.92);
            const hue   = p.map(n3, 0, 1, 0, 300);
            const hw    = tileW * scale * 0.5;
            const hh    = tileH * scale * 0.5;

            p.stroke(hue, 70, bri, 90);
            p.strokeWeight(sw);

            p.push();
            p.translate(cx, cy);
            p.rotate(angle);

            p.line(-hw, 0, hw, 0);
            p.line(0, -hh, 0, hh);

            const d = p.min(hw, hh) * 0.75;
            p.beginShape();
            p.vertex( d,  0);
            p.vertex( 0,  d);
            p.vertex(-d,  0);
            p.vertex( 0, -d);
            p.endShape(p.CLOSE);

            p.pop();
          }
        }

        t += PARAMS.speed.value;
      };

      p.windowResized = () => {
        const size = Math.min(window.innerWidth - 48, 712);
        p.resizeCanvas(size, size);
      };
    });
  },

  destroy() {
    if (this._p5) {
      this._p5.remove();
      this._p5 = null;
    }
  },
};

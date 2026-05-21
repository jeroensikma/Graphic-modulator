// p5.js sketch — geometric noise modulator
// Renders a grid of tiles; each tile's rotation and scale are driven by
// Perlin noise sampled at a position + time offset.

let t = 0; // global noise time offset

function setup() {
  const size = Math.min(windowWidth - 32, 720);
  const cvs  = createCanvas(size, size);
  cvs.parent('canvas-wrapper');
  colorMode(HSB, 360, 100, 100, 100);
  strokeCap(ROUND);
  noFill();
}

function draw() {
  background(0, 0, 6);

  const cols  = Math.round(PARAMS.cols.value);
  const ns    = PARAMS.noiseScale.value;
  const twist = PARAMS.twist.value;
  const sw    = PARAMS.strokeW.value;
  const bri   = map(PARAMS.brightness.value, 80, 255, 30, 100);

  const tileW = width  / cols;
  const tileH = height / cols;

  for (let row = 0; row < cols; row++) {
    for (let col = 0; col < cols; col++) {
      const cx = (col + 0.5) * tileW;
      const cy = (row + 0.5) * tileH;

      // Three independent noise layers
      const n1 = noise(col * ns, row * ns, t);
      const n2 = noise(col * ns + 100, row * ns + 100, t * 0.7);
      const n3 = noise(col * ns + 200, row * ns + 200, t * 1.3);

      const angle = n1 * twist * TWO_PI;
      const scale = map(n2, 0, 1, 0.15, 0.92);
      const hue   = map(n3, 0, 1, 0, 300);

      const hw = tileW * scale * 0.5;
      const hh = tileH * scale * 0.5;

      stroke(hue, 70, bri, 90);
      strokeWeight(sw);

      push();
      translate(cx, cy);
      rotate(angle);

      // Cross shape: two perpendicular lines
      line(-hw, 0, hw, 0);
      line(0, -hh, 0, hh);

      // Outer diamond outline
      const d = min(hw, hh) * 0.75;
      beginShape();
      vertex( d,  0);
      vertex( 0,  d);
      vertex(-d,  0);
      vertex( 0, -d);
      endShape(CLOSE);

      pop();
    }
  }

  t += PARAMS.speed.value;
}

function windowResized() {
  const size = Math.min(windowWidth - 32, 720);
  resizeCanvas(size, size);
}

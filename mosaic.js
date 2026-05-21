// Image Mosaic modulator — slices an uploaded image into a grid of colored rectangles.
// Active tiles randomly pop to a larger size with an outline for a generative effect.

const mosaicModulator = {
  name: 'Image Mosaic',
  _p5: null,

  init(canvasEl, controlsEl) {
    const PARAMS = {
      tileSize:   { label: 'Tile Size',   min: 0,    max: 80,   value: 20,   step: 1,    fmt: v => Math.round(v) + 'px' },
      activeSize: { label: 'Active Size', min: 1,    max: 10,   value: 3,    step: 1,    fmt: v => Math.round(v) + '×' },
      amount:     { label: 'Amount',      min: 1,    max: 20,   value: 5,    step: 1,    fmt: v => Math.round(v) },
      randomness: { label: 'Randomness',  min: 0,    max: 1,    value: 0,    step: 0.01, fmt: v => Math.round(v * 100) + '%' },
      duration:   { label: 'Duration',    min: 1000, max: 4000, value: 1200, step: 100,  fmt: v => (v / 1000).toFixed(1) + 's' },
    };

    buildControls(PARAMS, controlsEl);

    // Upload button row
    const uploadWrapper = document.createElement('div');
    uploadWrapper.className = 'control control-full';

    const fileInput = document.createElement('input');
    fileInput.type   = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';

    const uploadBtn = document.createElement('button');
    uploadBtn.className   = 'upload-btn';
    uploadBtn.textContent = 'Upload Image';
    uploadBtn.addEventListener('click', () => fileInput.click());

    uploadWrapper.appendChild(fileInput);
    uploadWrapper.appendChild(uploadBtn);
    controlsEl.appendChild(uploadWrapper);

    this._p5 = new p5((p) => {
      let srcPixels = null;
      let srcW      = 0;
      let origImg   = null;

      // key: 'col,row'  value: { startTime, rf }
      // rf (random factor 0–1) is fixed at activation time so each tile's
      // size stays stable for its lifetime regardless of slider changes.
      const activeTiles = new Map();

      function processImage(img) {
        origImg = img;
        activeTiles.clear();

        const gfx = p.createGraphics(p.width, p.height);
        gfx.pixelDensity(1);

        const imgAspect = img.width / img.height;
        const cvAspect  = p.width  / p.height;
        let sx = 0, sy = 0, sw = img.width, sh = img.height;
        if (imgAspect > cvAspect) {
          sw = img.height * cvAspect;
          sx = (img.width - sw) / 2;
        } else {
          sh = img.width / cvAspect;
          sy = (img.height - sh) / 2;
        }

        gfx.image(img, 0, 0, p.width, p.height, sx, sy, sw, sh);
        gfx.loadPixels();
        srcPixels = new Uint8ClampedArray(gfx.pixels);
        srcW = p.width;
        gfx.remove();
      }

      function sampleColor(cx, cy) {
        const sx  = Math.min(Math.max(Math.floor(cx), 0), srcW - 1);
        const sy  = Math.min(Math.max(Math.floor(cy), 0), p.height - 1);
        const idx = (sy * srcW + sx) * 4;
        return [srcPixels[idx], srcPixels[idx + 1], srcPixels[idx + 2]];
      }

      p.setup = () => {
        p.pixelDensity(1);
        const size = Math.min(window.innerWidth - 48, 712);
        const cvs  = p.createCanvas(size, size);
        cvs.parent(canvasEl);
        p.colorMode(p.RGB, 255);

        cvs.drop(file => {
          if (file.type.startsWith('image/')) {
            p.loadImage(file.data, img => processImage(img));
          }
        });

        fileInput.addEventListener('change', () => {
          const file = fileInput.files[0];
          if (!file) return;
          const url = URL.createObjectURL(file);
          p.loadImage(url, img => {
            processImage(img);
            URL.revokeObjectURL(url);
          });
          fileInput.value = '';
        });
      };

      p.draw = () => {
        if (!srcPixels) {
          drawPlaceholder();
          return;
        }

        p.background(14, 14, 14);

        const tileSize  = Math.round(PARAMS.tileSize.value);
        const baseMult  = Math.round(PARAMS.activeSize.value);
        const randomness = PARAMS.randomness.value;
        const target    = Math.round(PARAMS.amount.value);
        const now       = p.millis();
        const duration  = PARAMS.duration.value;

        // Nothing to draw if tiles are hidden
        if (tileSize < 1) return;

        const cols = Math.ceil(p.width  / tileSize) + 1;
        const rows = Math.ceil(p.height / tileSize) + 1;

        // Expire tiles older than duration
        for (const [key, data] of activeTiles) {
          if (now - data.startTime > duration) activeTiles.delete(key);
        }

        // Add one new tile per frame until target count is reached
        if (activeTiles.size < target) {
          const col = Math.floor(p.random(cols));
          const row = Math.floor(p.random(rows));
          activeTiles.set(`${col},${row}`, { startTime: now, rf: p.random() });
        }

        // Pass 1 — regular tiles, skipping active positions
        p.noStroke();
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            if (activeTiles.has(`${col},${row}`)) continue;
            const px = col * tileSize;
            const py = row * tileSize;
            const [r, g, b] = sampleColor(px + tileSize * 0.5, py + tileSize * 0.5);
            p.fill(r, g, b);
            p.rect(px, py, tileSize, tileSize);
          }
        }

        // Pass 2 — active tiles enlarged and outlined
        // Each tile's size is a lerp between baseMult (randomness=0, all same)
        // and a per-tile random multiple between 1× and baseMult (randomness=1).
        for (const [key, { rf }] of activeTiles) {
          const [col, row] = key.split(',').map(Number);
          if (col >= cols || row >= rows) continue;

          const px      = col * tileSize;
          const py      = row * tileSize;
          const randMult = 1 + rf * (baseMult - 1);          // 1× … baseMult
          const mult     = baseMult + (randMult - baseMult) * randomness;
          const bigSize  = Math.round(tileSize * mult);
          const [r, g, b] = sampleColor(px + tileSize * 0.5, py + tileSize * 0.5);

          p.fill(r, g, b);
          p.stroke(0);
          p.strokeWeight(1.5);
          p.rect(px, py, bigSize, bigSize);
          p.noStroke();
        }
      };

      function drawPlaceholder() {
        p.background(245, 245, 247);
        p.noStroke();

        p.drawingContext.save();
        p.drawingContext.strokeStyle = '#c7c7cc';
        p.drawingContext.lineWidth   = 1;
        p.drawingContext.setLineDash([8, 6]);
        p.drawingContext.strokeRect(28, 28, p.width - 56, p.height - 56);
        p.drawingContext.restore();

        p.fill(160);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(13);
        p.textFont('-apple-system, BlinkMacSystemFont, Helvetica Neue, Arial, sans-serif');
        p.text('Drop an image here\nor click Upload', p.width / 2, p.height / 2);
      }

      p.windowResized = () => {
        const size = Math.min(window.innerWidth - 48, 712);
        p.resizeCanvas(size, size);
        if (origImg) processImage(origImg);
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

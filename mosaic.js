// Image Mosaic modulator — slices an uploaded image into a grid of colored rectangles.
// Active tiles randomly pop to a larger size with an outline for a generative effect.

const mosaicModulator = {
  name: 'Image Mosaic',
  _p5: null,

  init(canvasEl, controlsEl) {
    const PARAMS = {
      tileSize:   { label: 'Tile Size',   min: 4,   max: 80,   value: 20,   step: 1,    fmt: v => Math.round(v) + 'px' },
      gap:        { label: 'Gap',         min: 0,   max: 12,   value: 2,    step: 0.5,  fmt: v => v.toFixed(1) + 'px' },
      radius:     { label: 'Roundness',   min: 0,   max: 1,    value: 0.2,  step: 0.05, fmt: v => Math.round(v * 100) + '%' },
      activeSize: { label: 'Active Size', min: 10,  max: 400,  value: 60,   step: 5,    fmt: v => Math.round(v) + 'px' },
      amount:     { label: 'Amount',      min: 1,   max: 40,   value: 5,    step: 1,    fmt: v => Math.round(v) },
      duration:   { label: 'Duration',    min: 100, max: 6000, value: 1200, step: 100,  fmt: v => (v / 1000).toFixed(1) + 's' },
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
      let srcPixels  = null;
      let srcW       = 0;
      let origImg    = null;

      // key: 'col,row'  value: millis() when the tile was activated
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

        const tileSize   = Math.max(2, PARAMS.tileSize.value);
        const gap        = PARAMS.gap.value;
        const step       = tileSize + gap;
        const radiusPx   = tileSize * PARAMS.radius.value * 0.5;
        const cols       = Math.ceil(p.width  / step) + 1;
        const rows       = Math.ceil(p.height / step) + 1;
        const now      = p.millis();
        const duration = PARAMS.duration.value;
        const bigSize  = PARAMS.activeSize.value;
        const target   = Math.round(PARAMS.amount.value);

        // Expire tiles that have been active longer than duration
        for (const [key, startTime] of activeTiles) {
          if (now - startTime > duration) activeTiles.delete(key);
        }

        // Add one new tile per frame until we reach the target amount
        if (activeTiles.size < target) {
          const col = Math.floor(p.random(cols));
          const row = Math.floor(p.random(rows));
          activeTiles.set(`${col},${row}`, now);
        }

        // Pass 1 — draw all regular tiles, skipping active ones
        p.noStroke();
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            if (activeTiles.has(`${col},${row}`)) continue;

            const px = col * step;
            const py = row * step;
            const cx = px + tileSize * 0.5;
            const cy = py + tileSize * 0.5;
            const [r, g, b] = sampleColor(cx, cy);

            p.fill(r, g, b);
            p.rect(px, py, tileSize, tileSize, radiusPx);
          }
        }

        // Pass 2 — draw active tiles enlarged and outlined, on top
        for (const [key] of activeTiles) {
          const [col, row] = key.split(',').map(Number);
          if (col >= cols || row >= rows) continue;

          const px        = col * step;
          const py        = row * step;
          const cx        = px + tileSize * 0.5;
          const cy        = py + tileSize * 0.5;
          const bigRadius = bigSize * PARAMS.radius.value * 0.5;
          const [r, g, b] = sampleColor(cx, cy);

          p.fill(r, g, b);
          p.stroke(0);
          p.strokeWeight(1.5);
          p.rect(px, py, bigSize, bigSize, bigRadius);
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

// Image Mosaic modulator — slices an uploaded image into a grid of colored rectangles.

const mosaicModulator = {
  name: 'Image Mosaic',
  _p5: null,

  init(canvasEl, controlsEl) {
    const PARAMS = {
      tileSize: { label: 'Tile Size',  min: 4,  max: 80, value: 20, step: 1,    fmt: v => Math.round(v) + 'px' },
      gap:      { label: 'Gap',        min: 0,  max: 12, value: 2,  step: 0.5,  fmt: v => v.toFixed(1) + 'px' },
      radius:   { label: 'Roundness',  min: 0,  max: 1,  value: 0.2,step: 0.05, fmt: v => Math.round(v * 100) + '%' },
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
      // Pixel buffer sampled at logical canvas resolution (pixelDensity 1).
      let srcPixels = null;
      let srcW = 0;
      let origImg  = null; // kept for re-processing on resize

      // Draw img into an offscreen buffer at canvas size using cover cropping,
      // then copy its pixel data into srcPixels.
      function processImage(img) {
        origImg = img;
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

      p.setup = () => {
        p.pixelDensity(1);
        const size = Math.min(window.innerWidth - 32, 720);
        const cvs  = p.createCanvas(size, size);
        cvs.parent(canvasEl);
        p.colorMode(p.RGB, 255);
        p.noStroke();

        // Drag-and-drop directly onto the canvas
        cvs.drop(file => {
          if (file.type.startsWith('image/')) {
            p.loadImage(file.data, img => processImage(img));
          }
        });

        // File-picker via button
        fileInput.addEventListener('change', () => {
          const file = fileInput.files[0];
          if (!file) return;
          const url = URL.createObjectURL(file);
          p.loadImage(url, img => {
            processImage(img);
            URL.revokeObjectURL(url);
          });
          fileInput.value = ''; // allow re-selecting the same file
        });
      };

      p.draw = () => {
        p.background(14, 14, 14);

        if (!srcPixels) {
          drawPlaceholder();
          return;
        }

        const tileSize = Math.max(2, PARAMS.tileSize.value);
        const gap      = PARAMS.gap.value;
        const step     = tileSize + gap;
        const radiusPx = tileSize * PARAMS.radius.value * 0.5;

        const cols = Math.ceil(p.width  / step) + 1;
        const rows = Math.ceil(p.height / step) + 1;

        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            const px = col * step;
            const py = row * step;

            // Sample from the center of the tile's footprint in the source buffer
            const cx  = Math.min(Math.floor(px + tileSize * 0.5), srcW - 1);
            const cy  = Math.min(Math.floor(py + tileSize * 0.5), p.height - 1);
            const idx = (cy * srcW + cx) * 4;

            p.fill(srcPixels[idx], srcPixels[idx + 1], srcPixels[idx + 2]);
            p.rect(px, py, tileSize, tileSize, radiusPx);
          }
        }
      };

      function drawPlaceholder() {
        p.fill(20);
        p.noStroke();
        p.rect(0, 0, p.width, p.height);

        // Dashed border via canvas 2D API
        p.drawingContext.save();
        p.drawingContext.strokeStyle = '#2a2a2a';
        p.drawingContext.lineWidth   = 1;
        p.drawingContext.setLineDash([6, 5]);
        p.drawingContext.strokeRect(24, 24, p.width - 48, p.height - 48);
        p.drawingContext.restore();

        p.fill(60);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(12);
        p.textFont('Courier New');
        p.text('Drop an image here\nor click Upload', p.width / 2, p.height / 2);
      }

      p.windowResized = () => {
        const size = Math.min(window.innerWidth - 32, 720);
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

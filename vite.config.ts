import { defineConfig, type Plugin } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

/** Dev-only endpoint: POST /__save {name, dataUrl} → .img2threejs/renders/<name>.png */
function reviewCapturePlugin(): Plugin {
  return {
    name: 'review-capture',
    configureServer(server) {
      server.middlewares.use('/__save', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('POST only');
          return;
        }
        let body = '';
        req.on('data', (c) => (body += c));
        req.on('end', () => {
          try {
            const { name, dataUrl } = JSON.parse(body) as { name: string; dataUrl: string };
            const safe = String(name).replace(/[^a-z0-9-_]/gi, '_');
            const dir = path.resolve(__dirname, '.img2threejs/renders');
            fs.mkdirSync(dir, { recursive: true });
            const b64 = dataUrl.split(',')[1];
            fs.writeFileSync(path.join(dir, `${safe}.png`), Buffer.from(b64, 'base64'));
            res.setHeader('content-type', 'application/json');
            res.end(JSON.stringify({ ok: true, file: `${safe}.png` }));
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ ok: false, error: String(err) }));
          }
        });
      });
    },
  };
}

/** Build-only: public/reference holds dev/QA reference imagery (545 KB+) that the
 *  site never fetches at runtime — keep it out of the deployed Pages artifact. */
function stripDevAssetsPlugin(): Plugin {
  return {
    name: 'strip-dev-reference-assets',
    apply: 'build',
    closeBundle() {
      fs.rmSync(path.resolve(__dirname, 'dist/reference'), { recursive: true, force: true });
    },
  };
}

export default defineConfig({
  base: './', // relative asset paths so the build works on GitHub Pages project URLs
  plugins: [reviewCapturePlugin(), stripDevAssetsPlugin()],
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // three / motion libs / app code download in parallel instead of as one
        // 700 KB serial chunk, and app-only edits don't re-ship the libraries
        manualChunks: {
          three: ['three'],
          motion: ['gsap', 'lenis'],
        },
      },
    },
  },
});

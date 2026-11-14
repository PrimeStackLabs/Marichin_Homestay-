import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const attachProxyErrorHandler = (proxy) => {
  proxy.on('error', (_err, _req, res) => {
    if (res && !res.headersSent && typeof res.writeHead === 'function') {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          success: false,
          message: 'Backend server is starting or temporarily unavailable.'
        })
      );
    }
  });
};

const devMediaCacheHeadersPlugin = () => ({
  name: 'marichin-dev-media-cache-headers',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url && /\.mp4(\?|$)/i.test(req.url)) {
        res.setHeader('Cache-Control', 'no-store');
      }
      next();
    });
  }
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), devMediaCacheHeadersPlugin()],
  server: {
    port: 3000,
    open: false,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        configure: attachProxyErrorHandler
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        configure: attachProxyErrorHandler
      }
    }
  }
})

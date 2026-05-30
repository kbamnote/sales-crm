import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: {
      port: 5173,
      // Only proxy in dev when no explicit backend URL is configured
      ...(env.VITE_API_URL ? {} : {
        proxy: {
          '/api': 'http://localhost:5000'
        }
      })
    }
  };
});

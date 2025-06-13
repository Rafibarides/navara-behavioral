import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(() => {
  // Use / for custom domain (navarabehavioralgroup.com) in both production and development
  const base = '/';
  
  return {
    plugins: [react()],
    base,
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      rollupOptions: {
        output: {
          manualChunks: undefined,
        },
      },
    },
    server: {
      historyApiFallback: true,
    },
    preview: {
      historyApiFallback: true,
    },
  };
})

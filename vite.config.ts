import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  // Chỉ set base path khi build cho production (GitHub Pages)
  // Development (localhost) sẽ dùng base path mặc định '/'
  const base = command === 'build' ? '/frontend-app/' : '/';
  
  return {
    base,
    plugins: [react()],
    server: {
      port: 5173,
      // ✅ Comment proxy khi dùng AWS backend
      // proxy: {
      //   '/v1': {
      //     target: 'http://localhost:8000',
      //     changeOrigin: true,
      //   },
      //   '/health': {
      //     target: 'http://localhost:8000',
      //     changeOrigin: true,
      //   },
      // },
    },
  };
})

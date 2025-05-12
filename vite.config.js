// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react'

export default defineConfig({
  optimizeDeps: {
    plugins: [react()],
    base: '/facepop/',
    include: ['@gomomento/sdk-web']
  },
});

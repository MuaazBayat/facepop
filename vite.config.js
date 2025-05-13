// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  optimizeDeps: {
    base: '/facepop/',
    include: ['@gomomento/sdk-web']
  },
});

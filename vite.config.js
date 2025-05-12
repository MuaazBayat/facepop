// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  optimizeDeps: {
    base: '/facepop-agents/',
    include: ['@gomomento/sdk-web']
  },
});

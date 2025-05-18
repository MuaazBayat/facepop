import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.js'),
      name: 'FacePop',
      fileName: 'facepop',
      formats: ['es']
    },
    rollupOptions: {
      // Make sure to externalize any large deps you don't want bundled
      external: ['@gomomento/sdk-web'],
    }
  }
});

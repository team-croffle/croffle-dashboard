import ui from '@nuxt/ui/vite';
import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import MotionResolver from 'motion-v/resolver';
// import fs from 'fs';
import { fileURLToPath, URL } from 'url';
import { defineConfig } from 'vite';

import { cloudflare } from "@cloudflare/vite-plugin";

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss(), ui({
    components: {
      dts: true,
      resolvers: [MotionResolver()],
    },
    ui: {
      colors: {
        neutral: 'neutral',
      },
    },
  }), cloudflare()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rolldownOptions: {
      onwarn(warning, warn) {
        if (warning.code === 'INVALID_ANNOTATION') return;
        warn(warning);
      },
      output: {
        strictExecutionOrder: true,
        codeSplitting: {
          groups: [
            { name: 'vue', test: /node_modules\/@vue/, priority: 4 },
            {
              name: 'nuxt-ui-runtime',
              test: /node_modules\/@nuxt\/ui\/dist\/runtime/,
              priority: 3,
            },
            { name: 'nuxt-ui', test: /node_modules\/@nuxt\/ui/, priority: 2 },
            { name: 'motion', test: /node_modules\/motion/, priority: 2 },
            { name: 'radix-vue', test: /node_modules\/reka-ui|radix-vue/, priority: 2 },
            { name: 'vendor', test: /node_modules/, priority: 1 },
          ],
        },
      },
    },
  },
  // server: {
  //   host: 'dashboard.croffledev.kr',
  //   port: 5173,
  //   https: {
  //     key: fs.readFileSync('./dashboard.croffledev.kr-key.pem'),
  //     cert: fs.readFileSync('./dashboard.croffledev.kr.pem'),
  //   },
  // },
});
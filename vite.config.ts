import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Served from https://alpha730.github.io/Resume/ on GitHub Pages,
// so assets need the repo name as their base path in production.
export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/Resume/' : '/',
  plugins: [react(), tailwindcss()],
});

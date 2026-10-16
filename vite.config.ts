import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 3000,
    // Exact preview host for this VM's dev-server preview (no blanket allowlist).
    allowedHosts: ['pv-2ec32782edab-35b4795b-62d6-4be3-919e-c1076ef84c83.style.dev'],
  },
  preview: {
    host: true,
    port: 3000,
  },
});

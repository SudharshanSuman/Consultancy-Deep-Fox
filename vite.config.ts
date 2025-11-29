import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    define: {
      // This maps your existing process.env.API_KEY code to the build environment
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  };
});
import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite'
import command from 'lucide-svelte/icons/command'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [svelte(), tailwindcss()],
  base: command === 'build' ? '/svelte-bpmn/' : '',
}));

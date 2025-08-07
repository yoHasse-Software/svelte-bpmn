/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,svelte}',
    // Include Skeleton UI components if you're using them
    './node_modules/@skeletonlabs/skeleton-svelte/**/*.{js,ts,svelte}'
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

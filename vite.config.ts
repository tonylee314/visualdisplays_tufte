import path from "node:path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

// "base" matches the GitHub Pages project URL: https://<user>.github.io/visualdisplays_tufte/
export default defineConfig({
  base: process.env.VITE_BASE ?? "/visualdisplays_tufte/",
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
})

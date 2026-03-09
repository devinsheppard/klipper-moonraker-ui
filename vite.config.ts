import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      "/moonraker": {
        target: "http://klipper.local:7125",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/moonraker/, ""),
      },
    },
  },
});

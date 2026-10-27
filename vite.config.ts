import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";
import { VitePWA } from "vite-plugin-pwa";

// `npm run phone` serve em HTTPS na rede local: o microfone do Chrome no Android exige HTTPS.
export default defineConfig(({ mode }) => ({
  base: "./",
  plugins: [
    react(),
    ...(mode === "phone" ? [basicSsl()] : []),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.svg"],
      manifest: {
        name: "Faísca Inglês",
        short_name: "Faísca",
        description: "Inglês em sessões curtas, com voz, pronúncia e dicção. Feito para TDAH.",
        lang: "pt-BR",
        start_url: "./",
        scope: "./",
        display: "standalone",
        orientation: "portrait",
        background_color: "#F4F6FA",
        theme_color: "#1F3FCC",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
        ]
      },
      workbox: { globPatterns: ["**/*.{js,css,html,svg,png,woff2}"] }
    })
  ],
  server: { host: true }
}));

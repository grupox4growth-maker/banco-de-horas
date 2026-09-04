import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ponto & Banco de Horas",
    short_name: "Ponto",
    description: "Bater ponto, banco de horas, produtividade e alertas de horário.",
    start_url: "/",
    display: "standalone",
    background_color: "#125e57",
    theme_color: "#125e57",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}

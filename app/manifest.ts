import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TutorMind",
    short_name: "TutorMind",
    description: "AI-powered lesson planning for tutors",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#030712",
    theme_color: "#2563eb",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}

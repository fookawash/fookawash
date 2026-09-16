import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FOOKA WASH - Doorstep Car Care",
    short_name: "FOOKA WASH",
    description: "Premium doorstep car wash & interior detailing service",
    start_url: "/",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#FF6B00",
    orientation: "portrait",
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
    ],
  };
}
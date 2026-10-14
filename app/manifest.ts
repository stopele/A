import type { MetadataRoute } from "next";
import { company } from "@/lib/config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${company.name} 가게 관리`,
    short_name: company.name,
    start_url: "/",
    display: "standalone",
    background_color: "#f4f6fa",
    theme_color: "#3b6ef5",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}

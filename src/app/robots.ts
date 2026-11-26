import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/sys-control",
          "/admin",
          "/checkout",
          "/carrito",
          "/cart",
          "/pedidos",
          "/orders",
          "/orden",
          "/garaje",
          "/servicios/pago",
          "/servicios/programados",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}

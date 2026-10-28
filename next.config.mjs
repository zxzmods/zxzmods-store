/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.DOCKER_BUILD === "true" ? "standalone" : undefined,
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "100mb",
    },
    serverComponentsExternalPackages: [
      "@opentelemetry/api",
      "@prisma/client",
      "firebase-admin",
    ],
    optimizePackageImports: [
      "lucide-react",
    ],
  },
  webpack: (config) => {
    return config;
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com https://www.googletagmanager.com https://accounts.google.com https://*.firebaseapp.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: blob: https://storage.googleapis.com https://*.supabase.co https://images.unsplash.com https://*.tile.openstreetmap.org https://maps.googleapis.com https://*.google.com https://lh3.googleusercontent.com",
              "connect-src 'self' https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://*.googleapis.com https://storage.googleapis.com https://*.supabase.co https://nominatim.openstreetmap.org https://router.project-osrm.org https://api.hacienda.go.cr https://tipodecambio.paginasweb.cr https://*.firebaseapp.com https://accounts.google.com",
              "frame-src 'self' https://www.google.com https://maps.google.com https://*.firebaseapp.com https://accounts.google.com",
              "media-src 'self' data: blob: https://storage.googleapis.com https://*.supabase.co",
            ].join("; "),
          },
        ],
      },
    ];
  },

  async redirects() {
    return [
      {
        source: "/garage",
        destination: "/garaje",
        permanent: true,
      },
      {
        source: "/garaje/configurar",
        destination: "/garaje/registrar",
        permanent: true,
      },
      {
        source: "/garage/registrar",
        destination: "/garaje/registrar",
        permanent: true,
      },
      {
        source: "/instalacion-domicilio",
        destination: "/servicios?service=installation",
        permanent: false,
      },
      {
        source: "/cotizar-envio",
        destination: "/servicios?service=delivery",
        permanent: false,
      },
      {
        source: "/traslado",
        destination: "/servicios?service=pickup",
        permanent: false,
      },
      {
        source: "/pickup",
        destination: "/servicios?service=pickup",
        permanent: false,
      },
      {
        source: "/delivery",
        destination: "/servicios?service=delivery",
        permanent: false,
      },
      {
        source: "/recogida-utv",
        destination: "/servicios?service=pickup",
        permanent: false,
      },
      {
        source: "/politica-privacidad",
        destination: "/privacidad",
        permanent: true,
      },
      {
        source: "/privacy-policy",
        destination: "/privacy",
        permanent: true,
      },
      {
        source: "/terms-of-service",
        destination: "/terms",
        permanent: true,
      },
      {
        source: "/condiciones",
        destination: "/terminos",
        permanent: true,
      },
    ];
  },

  async rewrites() {
    return [
      {
        source: "/__/auth/:path*",
        destination: "https://zxzmods-34a69.firebaseapp.com/__/auth/:path*",
      },
    ];
  },
};

export default nextConfig;

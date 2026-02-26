import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Modo estricto de React desactivado para evitar warnings en producción
  reactStrictMode: false,
  
  // Configuración de TypeScript
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Variables de entorno públicas
  env: {
    NEXT_PUBLIC_APP_NAME: "Deudas a Cero",
  },
  
  // Configuración de dominios de imágenes
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'deudasacero.es',
      },
      {
        protocol: 'https',
        hostname: '*.deudasacero.es',
      },
    ],
  },
  
  // Headers de seguridad
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
  
  // Compresión en producción
  compress: true,
  
  // Configuración de powering by header (ocultar X-Powered-By)
  poweredByHeader: false,
};

export default nextConfig;

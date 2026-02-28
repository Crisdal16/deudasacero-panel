import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Modo estricto de React desactivado para evitar warnings en producción
  reactStrictMode: false,
  
  // Ignorar errores de TypeScript durante build (temporal)
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Configuración de powering by header (ocultar X-Powered-By)
  poweredByHeader: false,
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // S3 (headers de segurança): não publica source maps do bundle do
  // browser em produção — dificulta reconstruir nomes originais de
  // arquivo/variável a partir do JS minificado.
  productionBrowserSourceMaps: false,
  // Remove o header `X-Powered-By: Next.js`, que facilita fingerprint da
  // stack para quem está reconhecendo o alvo antes de atacar.
  poweredByHeader: false,
};

export default nextConfig;

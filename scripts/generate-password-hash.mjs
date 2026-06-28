// scripts/generate-password-hash.mjs
// Gera o hash de uma senha para usar como ADMIN_PASSWORD_HASH.
// Uso: node scripts/generate-password-hash.mjs "sua-senha-aqui"

import { createHash } from "crypto";

const password = process.argv[2];

if (!password) {
  console.error("Uso: node scripts/generate-password-hash.mjs \"sua-senha-aqui\"");
  process.exit(1);
}

const hash = createHash("sha256").update(password).digest("hex");
console.log("\nADMIN_PASSWORD_HASH=" + hash + "\n");
console.log("Copie a linha acima e adicione como variável de ambiente:");
console.log("  - No .env.local (para testar localmente)");
console.log("  - Nas Environment Variables do projeto na Vercel (para produção)\n");

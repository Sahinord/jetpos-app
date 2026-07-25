// Build öncesi aktif rolü sabitler: .role.json yazar.
// Kullanım: node scripts/set-role.js <patron|mutfak|garson>
const fs = require("fs");
const path = require("path");
const { ROLES } = require("../roles");

const role = (process.argv[2] || "").toLowerCase();
if (!ROLES[role]) {
    console.error(`Geçersiz rol: "${role}". Seçenekler: ${Object.keys(ROLES).join(", ")}`);
    process.exit(1);
}

const out = path.join(__dirname, "..", ".role.json");
fs.writeFileSync(out, JSON.stringify({ role }, null, 2));
console.log(`✓ Aktif rol: ${ROLES[role].productName} (${ROLES[role].url})`);

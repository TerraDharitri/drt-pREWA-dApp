// src/utils/certificateTemplate.ts
// Builds a branded SVG certificate with tx hash + QR to explorer

export type CertificateOpts = {
  orgName: string;          // "Dharitri Foundation"
  amountText: string;       // e.g. "0.001 BNB"
  donor: string;            // 0xabc...
  tokenId: bigint | number; // ERC-1155 id (or whatever you use)
  dateText: string;         // e.g. "2025-08-26"
  chainLabel: string;       // e.g. "BNB Smart Chain Testnet"
  txHash: `0x${string}`;
  txUrl: string;            // full link to explorer
  logoDataUrl?: string;     // optional data: URL (PNG or SVG) for your logo
};

export async function buildCertificateSvg(opts: CertificateOpts): Promise<string> {
  const {
    orgName, amountText, donor, tokenId, dateText, chainLabel, txHash, txUrl, logoDataUrl,
  } = opts;

  const short = (s: string) => s.slice(0, 6) + "…" + s.slice(-4);

  // Generate QR code for the txUrl
  let qrDataUrl = "";
  try {
    const QR = await import("qrcode");
    qrDataUrl = await QR.default.toDataURL(txUrl, { margin: 1, width: 230 });
  } catch {
    // no QR if something goes wrong — still render a good-looking cert
    qrDataUrl = "";
  }

  const LOGO = logoDataUrl
    ? `<image href="${logoDataUrl}" x="96" y="96" width="120" height="120" />`
    : `
      <g transform="translate(96,96)">
        <circle cx="60" cy="60" r="60" fill="#DCFCE7"/>
        <text x="60" y="66" font-family="Inter,ui-sans-serif" font-weight="800" font-size="48" text-anchor="middle" fill="#065F46">D</text>
      </g>`;

  const QR = qrDataUrl
    ? `<rect x="1210" y="250" width="260" height="260" rx="16" fill="#F0FDF4" stroke="#BBF7D0"/>
       <image href="${qrDataUrl}" x="1225" y="265" width="230" height="230"/>
       <text x="1340" y="515" font-size="14" text-anchor="middle" fill="#065F46" font-family="Inter,ui-sans-serif">Scan to verify</text>`
    : ``;

  // 1600 x 900 canvas
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"  stop-color="#F8FAF9"/>
      <stop offset="100%" stop-color="#F3F7F5"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#0F172A10"/>
    </filter>
  </defs>

  <rect width="100%" height="100%" fill="url(#bg)"/>
  <rect x="80" y="80" width="1440" height="740" rx="28" fill="#FFFFFF" stroke="#E6EFE9" stroke-width="2" filter="url(#shadow)"/>

  ${LOGO}

  <text x="240" y="130" font-family="Inter,ui-sans-serif" font-weight="800" font-size="36" fill="#0F5132">${orgName}</text>
  <text x="240" y="170" font-family="Inter,ui-sans-serif" font-weight="600" font-size="22" fill="#2B6A4B">Certificate of Donation</text>

  <text x="240" y="230" font-family="Inter,ui-sans-serif" font-size="18" fill="#475569">This certifies that</text>
  <text x="240" y="270" font-family="Inter,ui-sans-serif" font-weight="700" font-size="28" fill="#111827">${short(donor)}</text>
  <text x="240" y="310" font-family="Inter,ui-sans-serif" font-size="18" fill="#475569">donated</text>
  <text x="240" y="360" font-family="Inter,ui-sans-serif" font-weight="800" font-size="46" fill="#111827">${amountText}</text>
  <text x="240" y="405" font-family="Inter,ui-sans-serif" font-size="18" fill="#475569">on ${dateText} — ${chainLabel}</text>

  <text x="240" y="455" font-family="Inter,ui-sans-serif" font-size="18" fill="#475569">Certificate Token ID:</text>
  <text x="460" y="455" font-family="Inter,ui-sans-serif" font-weight="700" font-size="20" fill="#111827">#${String(tokenId)}</text>

  <text x="240" y="505" font-family="Inter,ui-sans-serif" font-size="18" fill="#475569">Transaction:</text>
  <text x="240" y="540" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace" font-size="18" fill="#0F766E">${short(txHash)}</text>
  <text x="240" y="575" font-family="Inter,ui-sans-serif" font-size="16" fill="#64748B">${txUrl}</text>

  ${QR}

  <text x="800" y="780" text-anchor="middle" font-family="Inter,ui-sans-serif" font-size="12" fill="#94A3B8">© ${orgName}</text>
</svg>`;
}

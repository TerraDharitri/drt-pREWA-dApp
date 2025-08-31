import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type OrgInfo = {
  legalName: string;
  regNo?: string;
  address?: string;
  signatory?: string;
};

type Body = {
  chainId: number;
  txHash: string;
  contractAddress: `0x${string}`;
  tokenAddress: `0x${string}` | null;
  donorAddress: `0x${string}`;
  firstName: string;
  middleName?: string;
  lastName: string;
  email?: string;
  amount: string;      // decimal string
  assetSymbol: string; // e.g. BNB, USDT
  org: OrgInfo;
};

function bscTxUrl(chainId: number, tx: string) {
  const base = chainId === 97 ? "https://testnet.bscscan.com/tx/" : "https://bscscan.com/tx/";
  return base + tx;
}

function shortHex(addr: string, keep = 6) {
  if (!addr?.startsWith("0x") || addr.length <= 2 * keep + 2) return addr;
  return `${addr.slice(0, 2 + keep)}…${addr.slice(-keep)}`;
}

async function readLogoB64() {
  try {
    const p = path.join(process.cwd(), "public", "dharitri-logo.svg");
    const raw = await fs.readFile(p);
    return Buffer.from(raw).toString("base64");
  } catch {
    return "";
  }
}

async function qrPngDataUrl(text: string) {
  try {
    const QR: any = (await import("qrcode")).default ?? (await import("qrcode"));
    return await QR.toDataURL(text, { margin: 1, width: 520 });
  } catch {
    return "";
  }
}

function buildSvg(params: {
  org: OrgInfo;
  donorName: string;
  donorAddress: string;
  amount: string;
  asset: string;
  txHash: string;
  chainId: number;
  logoB64: string;
  qrDataUrl: string;
}) {
  const { org, donorName, donorAddress, amount, asset, txHash, chainId, logoB64, qrDataUrl } = params;
  const network = chainId === 97 ? "BNB Smart Chain Testnet" : "BNB Smart Chain";
  const scanUrl = bscTxUrl(chainId, txHash);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1920" height="1200" viewBox="0 0 1920 1200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .title { font: 700 72px Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; fill:#0f3d2e }
      .subtitle { font: 600 34px Inter, system-ui; fill: #0f3d2e }
      .label { font: 500 26px Inter, system-ui; fill: #374151 }
      .value { font: 700 56px Inter, system-ui; fill: #0f172a }
      .body { font: 400 24px Inter, system-ui; fill: #1f2937 }
      .fine { font: 400 20px Inter, system-ui; fill: #6b7280 }
    </style>
  </defs>

  <rect width="100%" height="100%" rx="28" ry="28" fill="#f6fbf8"/>

  <g transform="translate(100, 90)">
    <rect x="0" y="0" width="1720" height="140" rx="20" ry="20" fill="#eaf6f0"/>
    ${logoB64 ? `<image href="data:image/svg+xml;base64,${logoB64}" x="30" y="22" width="96" height="96" />` : ""}
    <text x="150" y="65" class="title">${org.legalName || "DHARITRI FOUNDATION"}</text>
    <text x="150" y="115" class="subtitle">Official Donation Receipt</text>
  </g>

  <g transform="translate(120, 300)">
    <text class="label" x="0" y="0">Reg / Company No:</text>
    <text class="body"  x="0" y="40">${org.regNo || ""}${org.address ? " — " + org.address : ""}</text>

    <text class="label" x="0" y="130">Donor</text>
    <text class="value" x="0" y="185">${donorName}</text>
    <text class="fine"  x="0" y="215">${shortHex(donorAddress)}</text>

    <text class="label" x="0" y="305">Amount</text>
    <text class="value" x="0" y="360">${amount} ${asset}</text>

    <text class="label" x="0" y="450">Date (UTC)</text>
    <text class="body"  x="0" y="495">${new Date().toISOString().slice(0,10)}</text>

    <text class="label" x="0" y="575">Network</text>
    <text class="body"  x="0" y="620">${network}</text>

    <text class="label" x="0" y="700">Transaction</text>
    <a href="${scanUrl}" target="_blank">
      <text class="body" x="0" y="745">${shortHex(txHash, 18)}</text>
    </a>
  </g>

  <g transform="translate(1240, 300)">
    <rect x="0" y="0" width="540" height="540" rx="28" ry="28" fill="#eaf6f0"/>
    ${qrDataUrl ? `<image href="${qrDataUrl}" x="50" y="50" width="440" height="440" />` : ""}
    <text class="fine" x="195" y="520">Scan to verify</text>
  </g>

  <g transform="translate(100, 1050)">
    <text class="fine" x="0" y="0">No goods or services were provided in exchange for this donation.</text>
    <text class="fine" x="0" y="60">© ${org.legalName || "DHARITRI FOUNDATION"}</text>
    <text class="fine" x="1420" y="0">${org.signatory || "Authorized Director"}</text>
  </g>
</svg>`;
}

export async function POST(req: NextRequest) {
  try {
    const body: Body = await req.json();

    const donorName = [body.firstName, body.middleName || "", body.lastName]
      .map((s) => (s || "").trim())
      .filter(Boolean)
      .join(" ");

    const logoB64 = await readLogoB64();
    const qr = await qrPngDataUrl(bscTxUrl(body.chainId, body.txHash));
    const svg = buildSvg({
      org: body.org || { legalName: "DHARITRI FOUNDATION" },
      donorName: donorName || body.donorAddress,
      donorAddress: body.donorAddress,
      amount: body.amount,
      asset: body.assetSymbol,
      txHash: body.txHash,
      chainId: body.chainId,
      logoB64,
      qrDataUrl: qr,
    });

    // Try to load resvg at runtime without letting webpack see the module name.
    let pngBase64: string | null = null;
    try {
      const pkg = "@resvg/" + "resvg-js";
      // eslint-disable-next-line no-eval
      const mod: any = await (eval("import"))(pkg);
      const Resvg = mod?.Resvg ?? mod?.default?.Resvg;
      if (Resvg) {
        const resvg = new Resvg(svg, { fitTo: { mode: "width", value: 1920 } });
        const png = resvg.render().asPng();
        pngBase64 = Buffer.from(png).toString("base64");
      }
    } catch (err) {
      // resvg unavailable: we’ll return without PNG; client UI can handle fallback.
      console.warn("resvg not available; skipping PNG render:", err);
    }

    // (Optional) email via Resend if we produced a PNG
    if (pngBase64 && process.env.RESEND_API_KEY && body.email) {
      try {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: process.env.CERT_FROM_EMAIL || "Dharitri <onboarding@resend.dev>",
          to: body.email,
          subject: "Your Dharitri Donation Receipt",
          text: `Thank you for your donation of ${body.amount} ${body.assetSymbol}. Tx: ${body.txHash}`,
          attachments: [
            {
              filename: "Dharitri-Donation-Receipt.png",
              content: Buffer.from(pngBase64, "base64"),
              contentType: "image/png",
            },
          ],
        });
      } catch (e) {
        console.warn("Resend email failed:", e);
      }
    }

    return NextResponse.json({
      ok: true,
      pngDataUrl: pngBase64 ? `data:image/png;base64,${pngBase64}` : null,
    });
  } catch (e: any) {
    console.error("/api/email-certificate error:", e);
    return NextResponse.json({ ok: false, error: e?.message || "Internal error" }, { status: 500 });
  }
}
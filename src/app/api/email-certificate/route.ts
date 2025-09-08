// src/app/api/email-certificate/route.ts

import { NextResponse } from "next/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { Resend } from "resend";
import { promises as fs } from "fs";
import path from "path";
import { isAddress } from "viem";
import { pREWAContracts } from "@/contracts/addresses"; // <--- FIX: Added this import

// Initialize the Resend client with your API key from environment variables
const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = process.env.RESEND_FROM_EMAIL || "no-reply@yourdomain.com";

// Define the shape of the incoming request data for validation
interface CertificateData {
  donorName: string;
  donorAddress: string;
  amount: string;
  symbol: string;
  timestamp: string; // e.g., "2025-09-08 11:27"
  tokenId: string;
  txHash: string;
  email: string;
  explorerUrl: string;
  chainId: number; // Add chainId to resolve the correct contract address
}

/**
 * Validates the incoming request body.
 */
function validateRequest(data: any): data is CertificateData {
  const required = ["donorName", "donorAddress", "amount", "symbol", "timestamp", "tokenId", "txHash", "email", "explorerUrl", "chainId"];
  for (const field of required) {
    if (data[field] === undefined) { // Check for undefined to allow empty strings if needed
      console.error(`Validation failed: Missing field '${field}'`);
      return false;
    }
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    console.error("Validation failed: Invalid email format");
    return false;
  }
  if (!isAddress(data.donorAddress)) {
      console.error("Validation failed: Invalid donor address");
      return false;
  }
  if (typeof data.chainId !== 'number' || ![56, 97].includes(data.chainId)) {
      console.error("Validation failed: Invalid or unsupported chainId");
      return false;
  }
  return true;
}


export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!validateRequest(body)) {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const {
      donorName, donorAddress, amount, symbol, timestamp,
      tokenId, txHash, email, explorerUrl, chainId
    } = body;
    
    // Dynamically get the donation contract address based on the chainId
    const donationContractAddress = (pREWAContracts as any)[chainId]?.Donation;
    if (!donationContractAddress) {
        return NextResponse.json({ error: `Donation contract not configured for chainId ${chainId}`}, { status: 400 });
    }

    // --- 1. Load Assets ---
    // Resolve paths relative to the project root
    const svgTemplatePath = path.join(process.cwd(), "src", "assets", "certificate-template.svg");
    const fontPath = path.join(process.cwd(), "src", "assets", "Inter-Bold.ttf");
    
    const [svgTemplate, fontBytes] = await Promise.all([
      fs.readFile(svgTemplatePath, "utf-8"),
      fs.readFile(fontPath),
    ]);
    
    // --- 2. Populate SVG Template ---
    const populatedSvg = svgTemplate
      .replace("{{DONOR_NAME}}", donorName)
      .replace("{{AMOUNT}}", `${amount} ${symbol}`)
      .replace("{{DATE}}", timestamp)
      .replace("{{CERTIFICATE_ID}}", `#${tokenId}`)
      .replace("{{TX_HASH}}", `${txHash.slice(0, 10)}...${txHash.slice(-8)}`)
      .replace("{{DONOR_ADDRESS}}", `${donorAddress.slice(0, 10)}...${donorAddress.slice(-8)}`);

    // --- 3. Convert SVG to PNG (with Dynamic Import) ---
    let pngBuffer: Buffer;
    try {
      const { Resvg } = await import('@resvg/resvg-js');
      const resvg = new Resvg(populatedSvg, {
        font: {
          fontFiles: [fontPath], 
          defaultFontFamily: "Inter",
        },
      });
      const pngData = resvg.render();
      pngBuffer = pngData.asPng();
    } catch (e: any) {
      console.error("Skipping PNG render due to resvg error:", e.message);
      return NextResponse.json({ error: "Failed to render certificate image." }, { status: 500 });
    }

    // --- 4. Create PDF ---
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([1200, 675]);
    const pngImage = await pdfDoc.embedPng(pngBuffer);
    page.drawImage(pngImage, { x: 0, y: 0, width: 1200, height: 675 });
    const pdfBytes = await pdfDoc.save();

    // --- 5. Send Email with PDF Attachment ---
    const attachment = {
      filename: `Dharitri_Donation_${tokenId}.pdf`,
      content: Buffer.from(pdfBytes),
    };

    const { data, error } = await resend.emails.send({
      from: `Dharitri Protocol <${fromEmail}>`,
      to: [email],
      subject: "Your Dharitri Protocol Donation Certificate",
      html: `
        <h1>Thank You for Your Donation!</h1>
        <p>Dear ${donorName},</p>
        <p>Thank you for your generous donation of ${amount} ${symbol} to the Dharitri Protocol. Your support is vital for our mission.</p>
        <p>Your official donation certificate is attached to this email.</p>
        <p>You can view your donation certificate on the blockchain here:</p>
        <p><a href="${explorerUrl}/token/${donationContractAddress}?a=${tokenId}">View Certificate #${tokenId}</a></p>
        <br/>
        <p>Sincerely,</p>
        <p>The Dharitri Team</p>
      `,
      attachments: [attachment],
    });

    if (error) {
      console.error("Resend API Error:", error);
      return NextResponse.json({ error: "Failed to send email." }, { status: 500 });
    }

    return NextResponse.json({ message: "Certificate sent successfully!", data }, { status: 200 });

  } catch (error: any) {
    console.error("Unhandled error in /api/email-certificate:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
// src/utils/certificate.ts
import { Canvg } from "canvg";

/** Render an SVG string to a PNG data URL in the browser. */
export async function renderSvgToPng(svgString: string, width: number, height: number): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D not available");

  const v = await Canvg.from(ctx, svgString);
  await v.render();
  return canvas.toDataURL("image/png");
}

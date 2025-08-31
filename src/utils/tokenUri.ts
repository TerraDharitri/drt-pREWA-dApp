// src/utils/tokenUri.ts
export async function dataUriToText(dataUri: string): Promise<string> {
  const [header, data] = dataUri.split(",", 2);
  const isBase64 = /;base64/i.test(header);

  if (isBase64) {
    if (typeof window !== "undefined") {
      // Browser
      const bin = atob(data);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return new TextDecoder().decode(bytes);
    } else {
      // Node (SSR)
      // eslint-disable-next-line n/no-deprecated-api
      return Buffer.from(data, "base64").toString("utf-8");
    }
  }

  return decodeURIComponent(data);
}
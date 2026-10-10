/**
 * Pure client/browser-compatible catalog token encoder and decoder.
 */
export function encodeCatalogToken(productIds: string[]): string {
  if (!productIds || productIds.length === 0) return "";
  try {
    return btoa(JSON.stringify(productIds))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  } catch {
    return productIds.join(",");
  }
}

export function decodeCatalogToken(token: string): string[] {
  if (!token || token.trim() === "") return [];
  try {
    let base64 = token.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }
    return JSON.parse(atob(base64));
  } catch {
    return token.split(",").filter(Boolean);
  }
}

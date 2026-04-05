import { normalizeText } from "@/lib/food";

export function getStoreLogoPath(shopName: string) {
  const normalizedShopName = normalizeText(shopName);

  if (normalizedShopName.includes("kaufland")) {
    return "/kauflandlogo.png";
  }

  if (normalizedShopName.includes("lidl")) {
    return "/lidllogo.png";
  }

  if (normalizedShopName.includes("albert")) {
    return "/albertlogo.png";
  }

  if (normalizedShopName.includes("tesco")) {
    return "/tescologo.png";
  }

  if (normalizedShopName.includes("globus")) {
    return "/globuslogo.png";
  }

  if (normalizedShopName.includes("billa")) {
    return "/billalogo.png";
  }

  if (normalizedShopName.includes("penny")) {
    return "/pennylogo.png";
  }

  if (normalizedShopName.includes("flop")) {
    return "/logo-flop-top-web.png";
  }

  if (normalizedShopName.includes("jip")) {
    return "/jiplogo.png";
  }

  if (normalizedShopName.includes("hruska")) {
    return "/hruskalogo.png";
  }

  return null;
}

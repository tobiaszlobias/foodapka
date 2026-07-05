export type FoodoraStoreConfig = {
  chainName: string;
  searchUrl: string;
  vendorCode: string;
  verticalType: string;
};

export const FOODORA_STORE_CONFIGS: FoodoraStoreConfig[] = [
  {
    chainName: "Albert",
    searchUrl:
      "https://www.foodora.cz/shop/im7c/albert-praha-breitcetlova/search?q=",
    vendorCode: "im7c",
    verticalType: "supermarket",
  },
  {
    chainName: "Billa",
    searchUrl:
      "https://www.foodora.cz/shop/vhcp/billa-ceske-budejovice/search?q=",
    vendorCode: "vhcp",
    verticalType: "supermarket",
  },
  {
    chainName: "Tesco",
    searchUrl:
      "https://www.foodora.cz/shop/ik68/tesco-hypermarket-opava/search?q=",
    vendorCode: "ik68",
    verticalType: "supermarket",
  },
];

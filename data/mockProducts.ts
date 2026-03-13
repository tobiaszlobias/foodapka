export type ProductStore = {
  store: string;
  price: number;
};

export type Product = {
  id: number;
  name: string;
  stores: ProductStore[];
};

export const products: Product[] = [
  {
    id: 1,
    name: "Coca Cola 1.5L",
    stores: [
      { store: "Tesco", price: 39.9 },
      { store: "Albert", price: 42.9 },
      { store: "Kaufland", price: 37.9 },
    ],
  },
  {
    id: 2,
    name: "Madeta Semi-Skimmed Milk 1L",
    stores: [
      { store: "Lidl", price: 24.9 },
      { store: "Billa", price: 27.5 },
      { store: "Penny", price: 23.9 },
    ],
  },
  {
    id: 3,
    name: "Penam Toast Bread 500g",
    stores: [
      { store: "Tesco", price: 29.9 },
      { store: "Albert", price: 31.9 },
      { store: "Globus", price: 28.5 },
    ],
  },
];

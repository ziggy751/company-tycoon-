export const ECONOMY = {
  blank: 1200,
  ink: 400,
  packaging: 200,
  shipping: 500,
  productionSeconds: 12,
  deliverySeconds: 8,
  capacity: 20,
  postCooldown: 35,
  postCost: 500,
} as const;
export const FITS = ["Regular", "Oversized", "Boxy"] as const;
export const AESTHETICS = [
  "Underground",
  "Minimalist luxury",
  "Skatewear",
  "Vintage",
  "Techwear",
] as const;
export const UPGRADES = [
  {
    id: "storage",
    name: "Stockroom shelving",
    cost: 12000,
    description: "Double storage from 20 to 40 pieces.",
    orders: 0,
  },
  {
    id: "press",
    name: "Precision heat press",
    cost: 18000,
    description: "Produce shirts in 7 seconds instead of 12.",
    orders: 5,
  },
  {
    id: "studio",
    name: "Product lighting kit",
    cost: 24000,
    description: "Better posts reach 50% more potential customers.",
    orders: 10,
  },
] as const;
export const MILESTONES = [
  { name: "Bedroom startup", revenue: 0 },
  { name: "Garage workshop", revenue: 1000000 },
  { name: "Commercial unit", revenue: 5000000 },
  { name: "First retail store", revenue: 15000000 },
];
export const money = (cents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: cents % 100 ? 2 : 0,
  }).format(cents / 100);

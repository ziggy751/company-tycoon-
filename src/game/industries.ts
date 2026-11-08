export type IndustryId = "streetwear" | "mtb" | "haircare";
export type ProductKind =
  | "shirt"
  | "frame-kit"
  | "mudguard"
  | "claw-clip"
  | "comb";
export type Industry = {
  id: IndustryId;
  name: string;
  tag: string;
  description: string;
  supplier: string;
  equipment: string;
  workflow: string;
  difficulty: string;
  garageRevenue: number;
  garageOrders: number;
  garageCost: number;
  products: ProductKind[];
};
export const INDUSTRIES: Industry[] = [
  {
    id: "streetwear",
    name: "Streetwear & Clothing",
    tag: "MAKE YOUR MARK",
    description:
      "Print your own cotton garments. Build a label one finished shirt at a time.",
    supplier: "Common Thread Supply Co.",
    equipment: "Heat press",
    workflow: "Design → buy blanks → heat transfer → fulfil",
    difficulty: "Hands-on maker",
    garageRevenue: 1000000,
    garageOrders: 50,
    garageCost: 180000,
    products: ["shirt"],
  },
  {
    id: "mtb",
    name: "MTB Accessories",
    tag: "BUILT FOR THE TRAIL",
    description:
      "Prototype frame-protection graphics and mudguards, commission small supplier batches, then inspect every delivery.",
    supplier: "Trailform Manufacturing",
    equipment: "Prototype & inspection bench",
    workflow:
      "Design → prototype → contract batch → quality inspection → fulfil",
    difficulty: "Planning & quality control",
    garageRevenue: 800000,
    garageOrders: 40,
    garageCost: 150000,
    products: ["frame-kit", "mudguard"],
  },
  {
    id: "haircare",
    name: "Hair & Styling Accessories",
    tag: "A DAILY ESSENTIAL",
    description:
      "Source finished clips and combs from a specialist supplier. Apply your own labels and prepare a branded collection.",
    supplier: "Form & Finish Accessories",
    equipment: "Label applicator & packing bench",
    workflow: "Design → source accessories → apply labels → fulfil",
    difficulty: "Sourcing & presentation",
    garageRevenue: 600000,
    garageOrders: 60,
    garageCost: 120000,
    products: ["claw-clip", "comb"],
  },
];
export const FUTURE_INDUSTRIES = [
  "Technology accessories",
  "Skateboard products",
  "Automotive accessories",
  "Home decor & furniture",
  "Sports equipment",
  "Bags & travel accessories",
  "Stationery & creative products",
];
export const PRODUCTS: Record<
  ProductKind,
  {
    name: string;
    material: string;
    unitCost: number;
    price: number;
    budget: number;
    seconds: number;
  }
> = {
  shirt: {
    name: "Cotton T-shirt",
    material: "Midweight cotton · heat transfer",
    unitCost: 1200,
    price: 3900,
    budget: 4900,
    seconds: 12,
  },
  "frame-kit": {
    name: "Frame-protection decal kit",
    material: "Cut TPU protection film",
    unitCost: 450,
    price: 2400,
    budget: 3200,
    seconds: 25,
  },
  mudguard: {
    name: "Flexible trail mudguard",
    material: "Supplier-moulded recycled PET",
    unitCost: 750,
    price: 2900,
    budget: 3900,
    seconds: 35,
  },
  "claw-clip": {
    name: "Acetate claw clip",
    material: "Supplier-finished cellulose acetate",
    unitCost: 600,
    price: 2200,
    budget: 2900,
    seconds: 20,
  },
  comb: {
    name: "Pocket styling comb",
    material: "Supplier-finished acetate",
    unitCost: 400,
    price: 1800,
    budget: 2400,
    seconds: 20,
  },
};
export const industryOf = (g: { industry?: IndustryId }) =>
  INDUSTRIES.find((i) => i.id === g.industry) || INDUSTRIES[0];
export const productOf = (d: { kind?: ProductKind }) =>
  PRODUCTS[d.kind || "shirt"];
export const industryUpgrades = (id: IndustryId) => [
  {
    id: "storage",
    name: "Stockroom shelving",
    cost: 12000,
    orders: 0,
    description: "Increase garment or component storage to 40 pieces.",
  },
  {
    id: "press",
    name:
      id === "streetwear"
        ? "Precision heat press"
        : id === "mtb"
          ? "Inspection fixture & prototype cutter"
          : "Roll-fed label applicator",
    cost: id === "haircare" ? 14000 : 18000,
    orders: 5,
    description:
      id === "streetwear"
        ? "Print shirts in 7 seconds."
        : id === "mtb"
          ? "Prototype and inspect in half the time."
          : "Apply labels in 3 seconds instead of 6.",
  },
  {
    id: "studio",
    name: "Product lighting kit",
    cost: 24000,
    orders: 10,
    description: "Photograph your products for 50% more discovery reach.",
  },
];
export const TUTORIAL_TASKS = [
  ["move", "Move around your workspace"],
  ["computer", "Open the design workstation"],
  ["design", "Save your first product"],
  ["materials", "Purchase supplies or a supplier batch"],
  ["produce", "Finish a saleable product"],
  ["price", "Set a selling price"],
  ["promote", "Publish a product reveal"],
  ["order", "Receive an order"],
  ["pack", "Pack an order"],
  ["deliver", "Deliver an order"],
  ["finances", "Open your financial report"],
] as const;
export type TutorialTask = (typeof TUTORIAL_TASKS)[number][0];

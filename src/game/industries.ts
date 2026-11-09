export type IndustryId = "streetwear" | "mtb" | "haircare";
export type ProductKind =
  | "shirt"
  | "longsleeve"
  | "hoodie"
  | "crewneck"
  | "shorts"
  | "tote"
  | "cap"
  | "beanie"
  | "frame-kit"
  | "mudguard"
  | "grips"
  | "end-plugs"
  | "number-plate"
  | "frame-strap"
  | "bottle"
  | "bottle-cage"
  | "top-cap"
  | "claw-clip"
  | "comb"
  | "brush"
  | "scrunchie"
  | "headband"
  | "hair-pins"
  | "hair-towel"
  | "styling-pouch";
export type ProductDefinition = {
  name: string;
  material: string;
  unitCost: number;
  price: number;
  budget: number;
  seconds: number;
  category: string;
  method:
    | "transfer"
    | "contract-sew"
    | "contract-mould"
    | "contract-machine"
    | "contract-accessory";
  quality: number;
  compatibility: string;
  symbol: string;
  shippingSize: "small" | "medium";
  unlockReputation: number;
};
export const METHOD_LABELS: Record<ProductDefinition["method"], string> = {
  transfer: "Heat transfer",
  "contract-sew": "Contract textile production",
  "contract-mould": "Contract moulding",
  "contract-machine": "Specialist machining",
  "contract-accessory": "Specialist supply",
};
const product = (
  name: string,
  material: string,
  unitCost: number,
  price: number,
  seconds: number,
  category: string,
  method: ProductDefinition["method"],
  compatibility: string,
  symbol: string,
  unlockReputation = 0,
): ProductDefinition => ({
  name,
  material,
  unitCost,
  price,
  budget: Math.round((price * 1.3) / 100) * 100,
  seconds,
  category,
  method,
  quality: method === "contract-machine" ? 4 : 3,
  compatibility,
  symbol,
  shippingSize: category === "Clothing" ? "medium" : "small",
  unlockReputation,
});
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
      "Print cotton tees and commission sewn apparel, headwear and bags. Check each contracted collection at your bench.",
    supplier: "Common Thread Supply Co.",
    equipment: "Heat press",
    workflow:
      "Design → print tees or contract sewing → receive & inspect → fulfil",
    difficulty: "Hands-on maker",
    garageRevenue: 1000000,
    garageOrders: 50,
    garageCost: 180000,
    products: [
      "shirt",
      "longsleeve",
      "hoodie",
      "crewneck",
      "shorts",
      "tote",
      "cap",
      "beanie",
    ],
  },
  {
    id: "mtb",
    name: "MTB Accessories",
    tag: "BUILT FOR THE TRAIL",
    description:
      "Prototype trail accessories, commission moulded or machined batches, then inspect every delivery.",
    supplier: "Trailform Manufacturing",
    equipment: "Prototype & inspection bench",
    workflow:
      "Design → prototype → contract batch → quality inspection → fulfil",
    difficulty: "Planning & quality control",
    garageRevenue: 800000,
    garageOrders: 40,
    garageCost: 150000,
    products: [
      "frame-kit",
      "mudguard",
      "grips",
      "end-plugs",
      "number-plate",
      "frame-strap",
      "bottle",
      "bottle-cage",
      "top-cap",
    ],
  },
  {
    id: "haircare",
    name: "Hair & Styling Accessories",
    tag: "A DAILY ESSENTIAL",
    description:
      "Source grooming tools, fabric accessories and travel essentials. Label and prepare each collection.",
    supplier: "Form & Finish Accessories",
    equipment: "Label applicator & packing bench",
    workflow: "Design → source accessories → apply labels → fulfil",
    difficulty: "Sourcing & presentation",
    garageRevenue: 600000,
    garageOrders: 60,
    garageCost: 120000,
    products: [
      "claw-clip",
      "comb",
      "brush",
      "scrunchie",
      "headband",
      "hair-pins",
      "hair-towel",
      "styling-pouch",
    ],
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
export const PRODUCTS: Record<ProductKind, ProductDefinition> = {
  shirt: {
    ...product(
      "Cotton T-shirt",
      "Midweight cotton · heat transfer",
      1200,
      3900,
      12,
      "Clothing",
      "transfer",
      "Regular, oversized or boxy fit",
      "♧",
    ),
    budget: 4900,
  },
  longsleeve: product(
    "Long-sleeve shirt",
    "180 gsm cotton jersey · contracted sewing & screen print",
    1600,
    4600,
    28,
    "Clothing",
    "contract-sew",
    "Unisex, regular fit",
    "♧",
  ),
  hoodie: product(
    "Pullover hoodie",
    "350 gsm fleece · contracted cut, sew & embroidery",
    2900,
    7900,
    44,
    "Clothing",
    "contract-sew",
    "Unisex pullover; embroidered chest mark",
    "♧",
    3,
  ),
  crewneck: product(
    "Crewneck jumper",
    "300 gsm brushed fleece · contracted ribbing & screen print",
    2400,
    6500,
    36,
    "Clothing",
    "contract-sew",
    "Unisex crew neck",
    "♧",
  ),
  shorts: product(
    "Jersey shorts",
    "240 gsm cotton · contracted waistband sewing",
    1500,
    4200,
    30,
    "Clothing",
    "contract-sew",
    "Elastic waist; woven label",
    "♧",
  ),
  tote: product(
    "Canvas tote bag",
    "320 gsm canvas · contracted stitching & screen print",
    900,
    2900,
    24,
    "Bags",
    "contract-sew",
    "12 litre; reinforced handles",
    "▱",
  ),
  cap: product(
    "Six-panel cap",
    "Cotton twill · contracted panel sewing & embroidery",
    1100,
    3400,
    32,
    "Headwear",
    "contract-sew",
    "Adjustable strap, 54–62 cm",
    "⌒",
  ),
  beanie: product(
    "Rib knit beanie",
    "Recycled acrylic · contracted knitting & woven patch",
    850,
    2800,
    26,
    "Headwear",
    "contract-sew",
    "Stretch rib, adult size",
    "⌒",
  ),
  "frame-kit": {
    ...product(
      "Frame-protection decal kit",
      "Cut TPU protection film",
      450,
      2400,
      25,
      "Protection",
      "contract-accessory",
      "Trim-to-fit, painted frames only",
      "▱",
    ),
    budget: 3200,
  },
  mudguard: {
    ...product(
      "Flexible trail mudguard",
      "Supplier-moulded recycled PET",
      750,
      2900,
      35,
      "Protection",
      "contract-mould",
      "Fork arch zip ties, check tyre clearance",
      "▱",
    ),
    budget: 3900,
  },
  grips: product(
    "Trail grips",
    "Dual compound rubber · contracted moulding",
    950,
    3200,
    34,
    "Cockpit",
    "contract-mould",
    "22.2 mm bars; closed ends",
    "◎",
  ),
  "end-plugs": product(
    "Handlebar end plugs",
    "Nylon expansion plug · contracted moulding",
    250,
    1200,
    22,
    "Cockpit",
    "contract-mould",
    "17–21 mm internal diameter",
    "◎",
  ),
  "number-plate": product(
    "Race number plate",
    "Printed polypropylene · die cutting",
    350,
    1600,
    20,
    "Race accessories",
    "contract-accessory",
    "Universal cable tie mounts",
    "▱",
  ),
  "frame-strap": product(
    "Frame tool strap",
    "Woven nylon · contracted stitching",
    500,
    2100,
    26,
    "Storage",
    "contract-sew",
    "30–70 mm tubes; soft backing",
    "∞",
  ),
  bottle: product(
    "Trail water bottle",
    "Food-contact certified LDPE · moulding & print",
    400,
    1800,
    28,
    "Hydration",
    "contract-mould",
    "650 ml; standard 74 mm cage",
    "♙",
  ),
  "bottle-cage": product(
    "Composite bottle cage",
    "Glass-reinforced nylon · supplier moulding",
    650,
    2500,
    32,
    "Hydration",
    "contract-mould",
    "64 mm frame bosses; 74 mm bottles",
    "◎",
  ),
  "top-cap": product(
    "Headset top cap",
    "CNC aluminium · specialist machining & anodising",
    550,
    2300,
    40,
    "Cockpit",
    "contract-machine",
    "1⅛ inch steerer; preload cap only",
    "◎",
    5,
  ),
  "claw-clip": {
    ...product(
      "Acetate claw clip",
      "Supplier-finished cellulose acetate",
      600,
      2200,
      20,
      "Hair accessories",
      "contract-accessory",
      "Medium hair; 8 cm spring clip",
      "⋒",
    ),
    budget: 2900,
  },
  comb: {
    ...product(
      "Pocket styling comb",
      "Supplier-finished acetate",
      400,
      1800,
      20,
      "Grooming tools",
      "contract-accessory",
      "Fine and medium teeth",
      "▤",
    ),
    budget: 2400,
  },
  brush: product(
    "Paddle hairbrush",
    "Bamboo handle · cushioned nylon pins",
    800,
    2800,
    27,
    "Grooming tools",
    "contract-accessory",
    "Dry detangling; cushioned head",
    "▤",
  ),
  scrunchie: product(
    "Satin scrunchie",
    "Polyester satin · contracted fabric sewing",
    230,
    1200,
    18,
    "Hair accessories",
    "contract-sew",
    "Fabric-covered elastic",
    "◎",
  ),
  headband: product(
    "Fabric headband",
    "Cotton elastane · contracted stitching",
    320,
    1600,
    22,
    "Hair accessories",
    "contract-sew",
    "Stretch adult band",
    "⋒",
  ),
  "hair-pins": product(
    "Hair pin set",
    "Coated steel · finished set of six",
    180,
    900,
    16,
    "Hair accessories",
    "contract-accessory",
    "Rounded tips; set of six",
    "∩",
  ),
  "hair-towel": product(
    "Microfibre hair towel",
    "Polyester microfibre · contracted hem & button",
    650,
    2400,
    30,
    "Textiles",
    "contract-sew",
    "Turban wrap; one size",
    "▱",
  ),
  "styling-pouch": product(
    "Travel styling pouch",
    "Recycled nylon · contracted zip & lining",
    700,
    2600,
    32,
    "Travel",
    "contract-sew",
    "1.5 litre; accessories sold separately",
    "▱",
  ),
};
export const industryOf = (g: { industry?: IndustryId }) =>
  INDUSTRIES.find((i) => i.id === g.industry) || INDUSTRIES[0];
export const productOf = (d: { kind?: ProductKind }) =>
  PRODUCTS[d.kind || "shirt"];
export const supplierUnitCost = (d: {
  kind?: ProductKind;
  finish?: "standard" | "premium";
}) => Math.round(productOf(d).unitCost * (d.finish === "premium" ? 1.25 : 1));
export const directUnitCost = (d: {
  kind?: ProductKind;
  finish?: "standard" | "premium";
}) =>
  supplierUnitCost(d) +
  700 +
  (productOf(d).method === "transfer"
    ? 400
    : INDUSTRIES[2].products.includes(d.kind!)
      ? 200
      : 0);
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

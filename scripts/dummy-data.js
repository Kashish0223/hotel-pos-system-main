// scripts/dummy-data.js
/**
 * Master Comprehensive Dummy Dataset for Hotel POS & ERP Management System
 * Provides rich, cohesive, production-grade mock data across all modules:
 * - Staff & SuperAdmin
 * - Tables & Outlets
 * - Categories & Menu Items
 * - Inventory & Suppliers
 * - Orders & Kitchen KOT
 * - Authoritative Bills & Multi-Tender Payments
 * - Register Sessions & Cash Movements
 * - Debtors & Accounts Receivable
 * - Operational Expenses
 * - Supplier Purchases & Vendor Bills
 * - Customer Loyalty & Feedbacks
 * - System Settings & Tax Configurations
 */

const { ObjectId } = require("mongodb");

function daysAgo(days, hours = 12, minutes = 0) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

const today = new Date();

// -------------------------------------------------------------
// 1. Staff & SuperAdmin
// -------------------------------------------------------------
const staff = [
  {
    _id: new ObjectId("6724a0000000000000000001"),
    name: "Hotel Admin",
    email: "superadmin@hotel.com",
    password: "superadmin@2024",
    role: "superadmin",
    permissions: ["*"],
    isSuperAdmin: true,
    status: "active",
    phone: "+91 9876543210",
    createdAt: daysAgo(30),
  },
  {
    _id: new ObjectId("6724a0000000000000000002"),
    name: "Rahul Sharma",
    email: "manager@hotel.com",
    password: "manager@123",
    role: "Manager",
    department: "Operations & Finance",
    permissions: [
      "view_orders", "add_orders", "edit_orders", "manage_orders",
      "add_menu", "view_menu", "edit_menu", "delete_menu", "manage_menu",
      "add_inventory", "view_inventory", "edit_inventory", "delete_inventory", "manage_inventory",
      "view_reports", "view_analysis", "add_staff", "edit_staff", "view_staff", "manage_staff",
      "kitchen_display", "view_bill", "add_expenses", "view_expenses", "edit_expenses", "manage_expenses",
      "edit_settings", "manage_settings", "view_category", "add_category", "manage_category",
      "add_table", "view_table", "manage_table", "add_customer", "view_customer", "manage_customer",
      "manage_purchases", "view_purchases", "manage_debtors", "view_debtors",
      "finance:view_invoices", "finance:issue_invoice", "finance:apply_discount",
      "finance:approve_discount", "finance:issue_credit_note", "finance:manage_drawer",
      "finance:view_reports", "finance:export_ledgers"
    ],
    isSuperAdmin: false,
    status: "active",
    phone: "+91 9876543211",
    createdAt: daysAgo(28),
  },
  {
    _id: new ObjectId("6724a0000000000000000003"),
    name: "Amit Patel",
    email: "cashier@hotel.com",
    password: "cashier@123",
    role: "Cashier",
    department: "Front Office & Billing",
    permissions: [
      "view_orders", "view_reports", "view_bill", "add_orders",
      "process_payments", "finance:view_invoices", "finance:issue_invoice",
      "finance:apply_discount", "finance:manage_drawer"
    ],
    isSuperAdmin: false,
    status: "active",
    phone: "+91 9876543212",
    createdAt: daysAgo(25),
  },
  {
    _id: new ObjectId("6724a0000000000000000004"),
    name: "Chef Sanjeev Kapoor",
    email: "chef@hotel.com",
    password: "chef@123",
    role: "Chef",
    department: "Culinary Kitchen",
    permissions: ["view_orders", "view_menu", "kitchen_display"],
    isSuperAdmin: false,
    status: "active",
    phone: "+91 9876543213",
    createdAt: daysAgo(25),
  },
  {
    _id: new ObjectId("6724a0000000000000000005"),
    name: "Vikas Kumar",
    email: "waiter@hotel.com",
    password: "waiter@123",
    role: "Waiter",
    department: "Dining Service",
    permissions: ["view_orders", "add_orders", "edit_orders", "view_menu", "process_payments"],
    isSuperAdmin: false,
    status: "active",
    phone: "+91 9876543214",
    createdAt: daysAgo(20),
  },
  {
    _id: new ObjectId("6724a0000000000000000006"),
    name: "Pooja Verma",
    email: "reception@hotel.com",
    password: "reception@123",
    role: "Receptionist",
    department: "Guest Relations",
    permissions: ["view_orders", "add_orders", "view_table", "manage_table", "add_customer", "view_customer"],
    isSuperAdmin: false,
    status: "active",
    phone: "+91 9876543215",
    createdAt: daysAgo(15),
  }
];

// -------------------------------------------------------------
// 2. Outlets
// -------------------------------------------------------------
const outlets = [
  {
    _id: new ObjectId("6724a1000000000000000001"),
    name: "The Royal Grand Pavilion (Fine Dining)",
    code: "RGP-01",
    address: "Floor 1, Grand Boulevard, City Center",
    phone: "+91 98765 43210",
    email: "pavilion@hotel-pos.com",
    status: "active",
    tableCount: 12,
    createdAt: daysAgo(30),
  },
  {
    _id: new ObjectId("6724a1000000000000000002"),
    name: "Skyline Rooftop Bar & Lounge",
    code: "SRB-02",
    address: "Floor 12 (Terrace), Grand Boulevard",
    phone: "+91 98765 43220",
    email: "skyline@hotel-pos.com",
    status: "active",
    tableCount: 8,
    createdAt: daysAgo(25),
  },
  {
    _id: new ObjectId("6724a1000000000000000003"),
    name: "Verandah Garden Bistro & Cafe",
    code: "VGB-03",
    address: "Ground Courtyard, Grand Boulevard",
    phone: "+91 98765 43230",
    email: "bistro@hotel-pos.com",
    status: "active",
    tableCount: 6,
    createdAt: daysAgo(20),
  }
];

// -------------------------------------------------------------
// 3. Tables
// -------------------------------------------------------------
const tables = [
  { tableNumber: "T-01", section: "Main Hall", capacity: 4, status: "available", createdAt: daysAgo(30) },
  { tableNumber: "T-02", section: "Main Hall", capacity: 4, status: "occupied", customerName: "Aarav Gupta", orderNumber: "ORD-1001", createdAt: daysAgo(30) },
  { tableNumber: "T-03", section: "Main Hall", capacity: 2, status: "available", createdAt: daysAgo(30) },
  { tableNumber: "T-04", section: "Main Hall", capacity: 6, status: "booked", customerName: "Pooja Mehta", bookingTime: "19:30", createdAt: daysAgo(30) },
  { tableNumber: "T-05", section: "Main Hall", capacity: 4, status: "available", createdAt: daysAgo(30) },
  { tableNumber: "G-01", section: "Garden Terrace", capacity: 4, status: "available", createdAt: daysAgo(30) },
  { tableNumber: "G-02", section: "Garden Terrace", capacity: 4, status: "occupied", customerName: "Rohan Verma", orderNumber: "ORD-1002", createdAt: daysAgo(30) },
  { tableNumber: "G-03", section: "Garden Terrace", capacity: 2, status: "available", createdAt: daysAgo(30) },
  { tableNumber: "R-01", section: "Rooftop Lounge", capacity: 6, status: "available", createdAt: daysAgo(30) },
  { tableNumber: "R-02", section: "Rooftop Lounge", capacity: 8, status: "available", createdAt: daysAgo(30) },
  { tableNumber: "R-03", section: "Rooftop Lounge", capacity: 4, status: "booked", customerName: "Vikram Singhania", bookingTime: "20:00", createdAt: daysAgo(30) },
  { tableNumber: "VIP-1", section: "VIP Cabana", capacity: 10, status: "available", createdAt: daysAgo(30) },
  { tableNumber: "VIP-2", section: "VIP Cabana", capacity: 12, status: "available", createdAt: daysAgo(30) },
];

// -------------------------------------------------------------
// 4. Categories (Menu, Inventory, Supplier)
// -------------------------------------------------------------
const categories = [
  { name: "Starters & Appetizers", type: "menu", icon: "🥟", description: "Crispy delicious starters", createdAt: daysAgo(30) },
  { name: "Main Course", type: "menu", icon: "🍛", description: "Hearty signature curries and platters", createdAt: daysAgo(30) },
  { name: "Tandoori & Grills", type: "menu", icon: "🍢", description: "Clay oven roasted kebabs and tikkas", createdAt: daysAgo(30) },
  { name: "Breads & Rice", type: "menu", icon: "🫓", description: "Fresh naan, roti, and fragrant biryanis", createdAt: daysAgo(30) },
  { name: "Beverages & Cocktails", type: "menu", icon: "🍹", description: "Refreshing mocktails and craft beverages", createdAt: daysAgo(30) },
  { name: "Desserts", type: "menu", icon: "🍨", description: "Sweet indulgence to finish your meal", createdAt: daysAgo(30) },
  // Inventory categories
  { name: "Dairy & Eggs", type: "inventory", icon: "🥛", description: "Milk, butter, paneer, and eggs", createdAt: daysAgo(30) },
  { name: "Meat & Poultry", type: "inventory", icon: "🍗", description: "Fresh chicken, mutton, and seafood", createdAt: daysAgo(30) },
  { name: "Grains & Dry Goods", type: "inventory", icon: "🌾", description: "Basmati rice, flour, and pulses", createdAt: daysAgo(30) },
  { name: "Oils & Sauces", type: "inventory", icon: "🫒", description: "Cooking oil, olive oil, and condiments", createdAt: daysAgo(30) },
  { name: "Fresh Produce", type: "inventory", icon: "🥦", description: "Vegetables, herbs, and fruits", createdAt: daysAgo(30) },
  // Supplier categories
  { name: "Dairy Supplier", type: "supplier", icon: "🧀", description: "Wholesale dairy vendors", createdAt: daysAgo(30) },
  { name: "Poultry & Meat Supplier", type: "supplier", icon: "🥩", description: "Cold-chain protein distributors", createdAt: daysAgo(30) },
  { name: "Grocery & Spices Supplier", type: "supplier", icon: "🌶️", description: "Dry groceries and aromatic spices", createdAt: daysAgo(30) },
  { name: "Beverage Supplier", type: "supplier", icon: "🍾", description: "Craft syrups and commercial beverages", createdAt: daysAgo(30) },
];

// -------------------------------------------------------------
// 5. Menu Items
// -------------------------------------------------------------
const menuItems = [
  {
    _id: new ObjectId("6724a2000000000000000001"),
    name: "Paneer Tikka Angara",
    nameEn: "Paneer Tikka Angara",
    price: 340,
    category: "Starters & Appetizers",
    categoryName: "Starters & Appetizers",
    description: "Charcoal grilled cottage cheese cubes marinated in Kashmiri chili and aromatic spices",
    type: "veg",
    available: true,
    taxRate: 5,
    createdAt: daysAgo(30),
  },
  {
    _id: new ObjectId("6724a2000000000000000002"),
    name: "Crispy Corn & Water Chestnut",
    nameEn: "Crispy Corn & Water Chestnut",
    price: 280,
    category: "Starters & Appetizers",
    categoryName: "Starters & Appetizers",
    description: "Tossed with scallions, crushed black pepper, and wok sauce",
    type: "veg",
    available: true,
    taxRate: 5,
    createdAt: daysAgo(30),
  },
  {
    _id: new ObjectId("6724a2000000000000000003"),
    name: "Chicken Malai Tikka",
    nameEn: "Chicken Malai Tikka",
    price: 420,
    category: "Tandoori & Grills",
    categoryName: "Tandoori & Grills",
    description: "Tender chicken chunks marinated in rich cream, cashew paste, and mild herbs",
    type: "non-veg",
    available: true,
    taxRate: 5,
    createdAt: daysAgo(30),
  },
  {
    _id: new ObjectId("6724a2000000000000000004"),
    name: "Mutton Seekh Kebab Peshawari",
    nameEn: "Mutton Seekh Kebab Peshawari",
    price: 480,
    category: "Tandoori & Grills",
    categoryName: "Tandoori & Grills",
    description: "Minced lamb infused with aromatic whole spices, skewered and cooked in tandoor",
    type: "non-veg",
    available: true,
    taxRate: 5,
    createdAt: daysAgo(30),
  },
  {
    _id: new ObjectId("6724a2000000000000000005"),
    name: "Butter Chicken Grand Cru",
    nameEn: "Butter Chicken Grand Cru",
    price: 490,
    category: "Main Course",
    categoryName: "Main Course",
    description: "Slow-cooked boneless tandoori chicken in a velvety tomato, cream, and butter gravy",
    type: "non-veg",
    available: true,
    taxRate: 5,
    createdAt: daysAgo(30),
  },
  {
    _id: new ObjectId("6724a2000000000000000006"),
    name: "Dal Makhani Royal",
    nameEn: "Dal Makhani Royal",
    price: 360,
    category: "Main Course",
    categoryName: "Main Course",
    description: "Black lentils simmered overnight with butter, cream, and subtle whole spices",
    type: "veg",
    available: true,
    taxRate: 5,
    createdAt: daysAgo(30),
  },
  {
    _id: new ObjectId("6724a2000000000000000007"),
    name: "Kadhai Paneer Lazeez",
    nameEn: "Kadhai Paneer Lazeez",
    price: 380,
    category: "Main Course",
    categoryName: "Main Course",
    description: "Cottage cheese cubes tossed with bell peppers, onions, and freshly ground coriander spices",
    type: "veg",
    available: true,
    taxRate: 5,
    createdAt: daysAgo(30),
  },
  {
    _id: new ObjectId("6724a2000000000000000008"),
    name: "Dum Biryani (Chicken)",
    nameEn: "Dum Biryani (Chicken)",
    price: 460,
    category: "Breads & Rice",
    categoryName: "Breads & Rice",
    description: "Fragrant basmati rice layered with spiced chicken, caramelized onions, and saffron",
    type: "non-veg",
    available: true,
    taxRate: 5,
    createdAt: daysAgo(30),
  },
  {
    _id: new ObjectId("6724a2000000000000000009"),
    name: "Subz Dum Biryani",
    nameEn: "Subz Dum Biryani",
    price: 380,
    category: "Breads & Rice",
    categoryName: "Breads & Rice",
    description: "Layered garden vegetables and basmati rice sealed with dough and slow-cooked in handi",
    type: "veg",
    available: true,
    taxRate: 5,
    createdAt: daysAgo(30),
  },
  {
    _id: new ObjectId("6724a2000000000000000010"),
    name: "Garlic Butter Naan",
    nameEn: "Garlic Butter Naan",
    price: 90,
    category: "Breads & Rice",
    categoryName: "Breads & Rice",
    description: "Tandoor baked leavened bread topped with roasted garlic and butter",
    type: "veg",
    available: true,
    taxRate: 5,
    createdAt: daysAgo(30),
  },
  {
    _id: new ObjectId("6724a2000000000000000011"),
    name: "Laccha Paratha Pudina",
    nameEn: "Laccha Paratha Pudina",
    price: 80,
    category: "Breads & Rice",
    categoryName: "Breads & Rice",
    description: "Multi-layered whole wheat bread dusted with crushed dried mint",
    type: "veg",
    available: true,
    taxRate: 5,
    createdAt: daysAgo(30),
  },
  {
    _id: new ObjectId("6724a2000000000000000012"),
    name: "Virgin Mojito Splash",
    nameEn: "Virgin Mojito Splash",
    price: 180,
    category: "Beverages & Cocktails",
    categoryName: "Beverages & Cocktails",
    description: "Crisp soda with fresh crushed mint, lime wedges, and brown sugar",
    type: "veg",
    available: true,
    taxRate: 5,
    createdAt: daysAgo(30),
  },
  {
    _id: new ObjectId("6724a2000000000000000013"),
    name: "Blue Lagoon Mocktail",
    nameEn: "Blue Lagoon Mocktail",
    price: 190,
    category: "Beverages & Cocktails",
    categoryName: "Beverages & Cocktails",
    description: "Citrus blue curacao blend with lemon spritz and crushed ice",
    type: "veg",
    available: true,
    taxRate: 5,
    createdAt: daysAgo(30),
  },
  {
    _id: new ObjectId("6724a2000000000000000014"),
    name: "Fresh Lime Soda (Sweet/Salt)",
    nameEn: "Fresh Lime Soda",
    price: 120,
    category: "Beverages & Cocktails",
    categoryName: "Beverages & Cocktails",
    description: "Freshly squeezed lemon with choice of sweet, salted, or mixed soda",
    type: "veg",
    available: true,
    taxRate: 5,
    createdAt: daysAgo(30),
  },
  {
    _id: new ObjectId("6724a2000000000000000015"),
    name: "Gulab Jamun with Ice Cream",
    nameEn: "Gulab Jamun with Ice Cream",
    price: 160,
    category: "Desserts",
    categoryName: "Desserts",
    description: "Warm golden milk dumplings served with vanilla bean ice cream",
    type: "veg",
    available: true,
    taxRate: 5,
    createdAt: daysAgo(30),
  },
  {
    _id: new ObjectId("6724a2000000000000000016"),
    name: "Kesari Rasmalai Supreme",
    nameEn: "Kesari Rasmalai Supreme",
    price: 180,
    category: "Desserts",
    categoryName: "Desserts",
    description: "Delicate cottage cheese patties soaked in saffron and cardamom flavored thick milk",
    type: "veg",
    available: true,
    taxRate: 5,
    createdAt: daysAgo(30),
  }
];

// -------------------------------------------------------------
// 6. Inventory Items (with low stock alert samples)
// -------------------------------------------------------------
const inventory = [
  { itemName: "Dairy Cottage Cheese (Paneer)", category: "Dairy & Eggs", type: "inventory", currentStock: 22, minStock: 8, unit: "kg", costPrice: 320, createdAt: daysAgo(30) },
  { itemName: "Fresh Chicken Breast (Boneless)", category: "Meat & Poultry", type: "inventory", currentStock: 35, minStock: 10, unit: "kg", costPrice: 240, createdAt: daysAgo(30) },
  { itemName: "Mutton Curry Cuts", category: "Meat & Poultry", type: "inventory", currentStock: 15, minStock: 6, unit: "kg", costPrice: 650, createdAt: daysAgo(30) },
  { itemName: "Basmati Biryani Rice (50kg Bag)", category: "Grains & Dry Goods", type: "inventory", currentStock: 6, minStock: 3, unit: "bags", costPrice: 3800, createdAt: daysAgo(30) },
  { itemName: "Wheat Flour / Atta (25kg Bag)", category: "Grains & Dry Goods", type: "inventory", currentStock: 5, minStock: 2, unit: "bags", costPrice: 950, createdAt: daysAgo(30) },
  { itemName: "Urad Dal Black Whole", category: "Grains & Dry Goods", type: "inventory", currentStock: 18, minStock: 5, unit: "kg", costPrice: 140, createdAt: daysAgo(30) },
  { itemName: "Fresh Amul Butter (500g Pack)", category: "Dairy & Eggs", type: "inventory", currentStock: 4, minStock: 10, unit: "packs", costPrice: 260, createdAt: daysAgo(30) }, // Low stock
  { itemName: "Fresh Cooking Cream (1L Tetra)", category: "Dairy & Eggs", type: "inventory", currentStock: 3, minStock: 8, unit: "cartons", costPrice: 195, createdAt: daysAgo(30) }, // Low stock
  { itemName: "Refined Sunflower Oil (15L Tin)", category: "Oils & Sauces", type: "inventory", currentStock: 8, minStock: 3, unit: "tins", costPrice: 2100, createdAt: daysAgo(30) },
  { itemName: "Kashmiri Chili Whole (Bulk)", category: "Grains & Dry Goods", type: "inventory", currentStock: 12, minStock: 4, unit: "kg", costPrice: 420, createdAt: daysAgo(30) },
  { itemName: "Farm Fresh Onions & Potatoes", category: "Fresh Produce", type: "inventory", currentStock: 45, minStock: 15, unit: "kg", costPrice: 35, createdAt: daysAgo(30) },
  { itemName: "Fresh Mint & Coriander Leaves", category: "Fresh Produce", type: "inventory", currentStock: 5, minStock: 2, unit: "kg", costPrice: 80, createdAt: daysAgo(30) },
];

// -------------------------------------------------------------
// 7. Suppliers
// -------------------------------------------------------------
const suppliers = [
  {
    _id: new ObjectId("6724a3000000000000000001"),
    name: "Metro Dairy & Fresh Foods Co.",
    contactPerson: "Sunil Agarwal",
    phone: "+91 98230 11223",
    email: "orders@metrodairy.com",
    address: "Plot 42, APMC Market Yard, Industrial Zone",
    gstin: "27AABCM1234D1Z2",
    category: "Dairy Supplier",
    status: "active",
    paymentTerms: "Net 15 Days",
    createdAt: daysAgo(30),
  },
  {
    _id: new ObjectId("6724a3000000000000000002"),
    name: "Sunrise Poultry & Cold Chain Logistics",
    contactPerson: "Irfan Sheikh",
    phone: "+91 98900 44556",
    email: "supply@sunrisepoultry.com",
    address: "Gala 18, Meat & Poultry Complex",
    gstin: "27AABCS5678E1Z9",
    category: "Poultry & Meat Supplier",
    status: "active",
    paymentTerms: "Net 7 Days",
    createdAt: daysAgo(30),
  },
  {
    _id: new ObjectId("6724a3000000000000000003"),
    name: "Royal Grain Traders & Spice Importers",
    contactPerson: "Mahesh Gupta",
    phone: "+91 98190 77889",
    email: "sales@royalgrains.in",
    address: "B-12, Grain Wholesale Merchant Chamber",
    gstin: "27AABCR9012F1Z4",
    category: "Grocery & Spices Supplier",
    status: "active",
    paymentTerms: "Net 30 Days",
    createdAt: daysAgo(30),
  },
  {
    _id: new ObjectId("6724a3000000000000000004"),
    name: "Himalayan Beverage & Soda Distributors",
    contactPerson: "Kavita Nair",
    phone: "+91 98450 33445",
    email: "distro@himalayanbev.com",
    address: "Unit 5, Warehouse Hub, Ring Road",
    gstin: "27AABCH3456G1Z1",
    category: "Beverage Supplier",
    status: "active",
    paymentTerms: "Net 15 Days",
    createdAt: daysAgo(30),
  }
];

// -------------------------------------------------------------
// 8. Purchases & Vendor Bills
// -------------------------------------------------------------
const purchases = [
  {
    _id: new ObjectId("6724a4000000000000000001"),
    vendorBillNumber: "VB-20261025-0104",
    supplierCategoryId: suppliers[0]._id,
    supplierName: suppliers[0].name,
    itemName: "Dairy Cottage Cheese (Paneer)",
    quantity: 20,
    unit: "kg",
    unitPrice: 320,
    unitPricePaise: 32000,
    totalPaise: 640000, // ₹6,400.00
    billStatus: "paid",
    isPaid: true,
    paidAt: daysAgo(8),
    createdAt: daysAgo(9),
  },
  {
    _id: new ObjectId("6724a4000000000000000002"),
    vendorBillNumber: "VB-20261028-0211",
    supplierCategoryId: suppliers[1]._id,
    supplierName: suppliers[1].name,
    itemName: "Fresh Chicken Breast (Boneless)",
    quantity: 30,
    unit: "kg",
    unitPrice: 240,
    unitPricePaise: 24000,
    totalPaise: 720000, // ₹7,200.00
    billStatus: "paid",
    isPaid: true,
    paidAt: daysAgo(5),
    createdAt: daysAgo(6),
  },
  {
    _id: new ObjectId("6724a4000000000000000003"),
    vendorBillNumber: "VB-20261101-0340",
    supplierCategoryId: suppliers[2]._id,
    supplierName: suppliers[2].name,
    itemName: "Basmati Biryani Rice (50kg Bag)",
    quantity: 4,
    unit: "bags",
    unitPrice: 3800,
    unitPricePaise: 380000,
    totalPaise: 1520000, // ₹15,200.00
    billStatus: "unpaid",
    isPaid: false,
    dueDate: daysAgo(-20), // Due in future
    createdAt: daysAgo(2),
  },
  {
    _id: new ObjectId("6724a4000000000000000004"),
    vendorBillNumber: "VB-20261102-0402",
    supplierCategoryId: suppliers[0]._id,
    supplierName: suppliers[0].name,
    itemName: "Fresh Amul Butter (500g Pack)",
    quantity: 15,
    unit: "packs",
    unitPrice: 260,
    unitPricePaise: 26000,
    totalPaise: 390000, // ₹3,900.00
    billStatus: "unpaid",
    isPaid: false,
    dueDate: daysAgo(-10),
    createdAt: daysAgo(1),
  }
];

// -------------------------------------------------------------
// 9. Operational Expenses
// -------------------------------------------------------------
const expenses = [
  {
    _id: new ObjectId("6724a5000000000000000001"),
    title: "Kitchen Commercial LPG Gas Refill (3 Cylinders)",
    category: "Utilities",
    amount: 5850,
    amountPaise: 585000,
    paymentMethod: "bank_transfer",
    date: daysAgo(4),
    paidTo: "Bharat Gas Commercial Agencies",
    approvedBy: "Rahul Sharma (Manager)",
    status: "approved",
    receiptNumber: "EXP-20261030-001",
    createdAt: daysAgo(4),
  },
  {
    _id: new ObjectId("6724a5000000000000000002"),
    title: "Deep Kitchen Chimney Exhaust Cleaning Service",
    category: "Maintenance",
    amount: 3500,
    amountPaise: 350000,
    paymentMethod: "upi",
    date: daysAgo(3),
    paidTo: "City Duct & Kitchen Hygiene Pros",
    approvedBy: "Rahul Sharma (Manager)",
    status: "approved",
    receiptNumber: "EXP-20261031-002",
    createdAt: daysAgo(3),
  },
  {
    _id: new ObjectId("6724a5000000000000000003"),
    title: "Biodegradable Dining Napkins & Paper Rolls",
    category: "Cleaning & Supplies",
    amount: 1450,
    amountPaise: 145000,
    paymentMethod: "cash",
    date: daysAgo(1),
    paidTo: "Supreme Paper Works",
    approvedBy: "Amit Patel (Cashier)",
    status: "approved",
    receiptNumber: "EXP-20261102-003",
    type: "petty_cash",
    createdAt: daysAgo(1),
  },
  {
    _id: new ObjectId("6724a5000000000000000004"),
    title: "Emergency Fresh Lemons, Herbs & Ice Blocks",
    category: "Raw Materials",
    amount: 820,
    amountPaise: 82000,
    paymentMethod: "cash",
    date: today,
    paidTo: "Local Subzi Mandi Express",
    approvedBy: "Amit Patel (Cashier)",
    status: "approved",
    receiptNumber: "EXP-20261103-004",
    type: "petty_cash",
    createdAt: today,
  }
];

// -------------------------------------------------------------
// 10. Debtors / Accounts Receivable (Corporate & VIP Tab Ledgers)
// -------------------------------------------------------------
const debtors = [
  {
    _id: new ObjectId("6724a6000000000000000001"),
    customerName: "Taj Corporate Events Hub",
    companyName: "Taj Hospitality Alliance Ltd.",
    phone: "+91 99200 88771",
    email: "accounts@tajcorporate.com",
    creditLimit: 50000,
    creditLimitPaise: 5000000,
    totalAmount: 24500,
    totalAmountPaise: 2450000,
    paidAmount: 6000,
    paidAmountPaise: 600000,
    outstandingAmount: 18500,
    outstandingAmountPaise: 1850000,
    status: "open",
    dueDate: daysAgo(-15), // Current (0-30 days)
    invoiceNumber: "INV-20261026-000142",
    createdAt: daysAgo(8),
  },
  {
    _id: new ObjectId("6724a6000000000000000002"),
    customerName: "Dr. Alok Verma (Private VIP Club)",
    companyName: "Verma Super Specialty Clinic",
    phone: "+91 98211 44332",
    email: "dr.verma@vermaclinic.org",
    creditLimit: 20000,
    creditLimitPaise: 2000000,
    totalAmount: 6400,
    totalAmountPaise: 640000,
    paidAmount: 0,
    paidAmountPaise: 0,
    outstandingAmount: 6400,
    outstandingAmountPaise: 640000,
    status: "open",
    dueDate: daysAgo(5), // 31-60 days bucket sample
    invoiceNumber: "INV-20260928-000098",
    createdAt: daysAgo(36),
  },
  {
    _id: new ObjectId("6724a6000000000000000003"),
    customerName: "Sharma Hospitality & Catering Tab",
    companyName: "Sharma Family Events & Banquets",
    phone: "+91 98334 55667",
    email: "sharma.events@gmail.com",
    creditLimit: 30000,
    creditLimitPaise: 3000000,
    totalAmount: 12000,
    totalAmountPaise: 1200000,
    paidAmount: 0,
    paidAmountPaise: 0,
    outstandingAmount: 12000,
    outstandingAmountPaise: 1200000,
    status: "open",
    dueDate: daysAgo(-10),
    invoiceNumber: "INV-20261029-000188",
    createdAt: daysAgo(5),
  }
];

// -------------------------------------------------------------
// 11. Customers
// -------------------------------------------------------------
const customers = [
  {
    _id: new ObjectId("6724a7000000000000000001"),
    name: "Aarav Gupta",
    email: "aarav.gupta@example.com",
    phone: "+91 9988776655",
    totalOrders: 16,
    totalSpent: 16840,
    points: 840,
    status: "active",
    tier: "Gold VIP",
    createdAt: daysAgo(60),
  },
  {
    _id: new ObjectId("6724a7000000000000000002"),
    name: "Pooja Mehta",
    email: "pooja.mehta@example.com",
    phone: "+91 9811223344",
    totalOrders: 10,
    totalSpent: 11400,
    points: 570,
    status: "active",
    tier: "Silver",
    createdAt: daysAgo(45),
  },
  {
    _id: new ObjectId("6724a7000000000000000003"),
    name: "Rohan Verma",
    email: "rohan.v@example.com",
    phone: "+91 9765432190",
    totalOrders: 5,
    totalSpent: 5200,
    points: 260,
    status: "active",
    tier: "Bronze",
    createdAt: daysAgo(30),
  },
  {
    _id: new ObjectId("6724a7000000000000000004"),
    name: "Dr. Alok Verma",
    email: "dr.verma@vermaclinic.org",
    phone: "+91 98211 44332",
    totalOrders: 12,
    totalSpent: 18900,
    points: 945,
    status: "active",
    tier: "Platinum VIP",
    createdAt: daysAgo(90),
  },
  {
    _id: new ObjectId("6724a7000000000000000005"),
    name: "Vikram Singhania",
    email: "vikram.s@singhania.com",
    phone: "+91 98777 66554",
    totalOrders: 8,
    totalSpent: 14200,
    points: 710,
    status: "active",
    tier: "Gold VIP",
    createdAt: daysAgo(40),
  }
];

// -------------------------------------------------------------
// 12. Multi-Day Orders (Spanning Last 7 Days + Today for Rich Charts)
// -------------------------------------------------------------
const sampleOrders = [
  // 6 Days Ago
  {
    orderNumber: "ORD-20261028-001",
    tableNumber: "T-01",
    orderType: "dine-in",
    status: "delivered",
    items: [
      { name: "Paneer Tikka Angara", quantity: 2, price: 340, total: 680 },
      { name: "Dal Makhani Royal", quantity: 1, price: 360, total: 360 },
      { name: "Garlic Butter Naan", quantity: 4, price: 90, total: 360 }
    ],
    subtotal: 1400,
    taxAmount: 70,
    totalAmount: 1470,
    customerName: "Aarav Gupta",
    createdAt: daysAgo(6, 13, 15),
  },
  {
    orderNumber: "ORD-20261028-002",
    tableNumber: "R-01",
    orderType: "dine-in",
    status: "delivered",
    items: [
      { name: "Chicken Malai Tikka", quantity: 2, price: 420, total: 840 },
      { name: "Dum Biryani (Chicken)", quantity: 2, price: 460, total: 920 },
      { name: "Virgin Mojito Splash", quantity: 3, price: 180, total: 540 }
    ],
    subtotal: 2300,
    taxAmount: 115,
    totalAmount: 2415,
    customerName: "Pooja Mehta",
    createdAt: daysAgo(6, 20, 30),
  },

  // 5 Days Ago
  {
    orderNumber: "ORD-20261029-001",
    tableNumber: "G-01",
    orderType: "dine-in",
    status: "delivered",
    items: [
      { name: "Butter Chicken Grand Cru", quantity: 2, price: 490, total: 980 },
      { name: "Garlic Butter Naan", quantity: 6, price: 90, total: 540 },
      { name: "Gulab Jamun with Ice Cream", quantity: 2, price: 160, total: 320 }
    ],
    subtotal: 1840,
    taxAmount: 92,
    totalAmount: 1932,
    customerName: "Rohan Verma",
    createdAt: daysAgo(5, 14, 0),
  },
  {
    orderNumber: "ORD-20261029-002",
    tableNumber: "VIP-1",
    orderType: "dine-in",
    status: "delivered",
    items: [
      { name: "Mutton Seekh Kebab Peshawari", quantity: 2, price: 480, total: 960 },
      { name: "Butter Chicken Grand Cru", quantity: 2, price: 490, total: 980 },
      { name: "Dum Biryani (Chicken)", quantity: 3, price: 460, total: 1380 },
      { name: "Blue Lagoon Mocktail", quantity: 4, price: 190, total: 760 }
    ],
    subtotal: 4080,
    taxAmount: 204,
    totalAmount: 4284,
    customerName: "Dr. Alok Verma",
    createdAt: daysAgo(5, 21, 15),
  },

  // 4 Days Ago
  {
    orderNumber: "ORD-20261030-001",
    tableNumber: "T-03",
    orderType: "dine-in",
    status: "delivered",
    items: [
      { name: "Crispy Corn & Water Chestnut", quantity: 1, price: 280, total: 280 },
      { name: "Kadhai Paneer Lazeez", quantity: 1, price: 380, total: 380 },
      { name: "Laccha Paratha Pudina", quantity: 3, price: 80, total: 240 }
    ],
    subtotal: 900,
    taxAmount: 45,
    totalAmount: 945,
    customerName: "Karan Johar",
    createdAt: daysAgo(4, 13, 45),
  },
  {
    orderNumber: "ORD-20261030-002",
    tableNumber: "R-02",
    orderType: "dine-in",
    status: "delivered",
    items: [
      { name: "Paneer Tikka Angara", quantity: 2, price: 340, total: 680 },
      { name: "Dum Biryani (Chicken)", quantity: 2, price: 460, total: 920 },
      { name: "Virgin Mojito Splash", quantity: 2, price: 180, total: 360 }
    ],
    subtotal: 1960,
    taxAmount: 98,
    totalAmount: 2058,
    customerName: "Vikram Singhania",
    createdAt: daysAgo(4, 20, 0),
  },

  // 3 Days Ago
  {
    orderNumber: "ORD-20261031-001",
    tableNumber: "T-05",
    orderType: "dine-in",
    status: "delivered",
    items: [
      { name: "Butter Chicken Grand Cru", quantity: 1, price: 490, total: 490 },
      { name: "Dal Makhani Royal", quantity: 1, price: 360, total: 360 },
      { name: "Garlic Butter Naan", quantity: 4, price: 90, total: 360 }
    ],
    subtotal: 1210,
    taxAmount: 60.5,
    totalAmount: 1270.5,
    customerName: "Ananya Roy",
    createdAt: daysAgo(3, 14, 10),
  },

  // 2 Days Ago
  {
    orderNumber: "ORD-20261101-001",
    tableNumber: "G-02",
    orderType: "dine-in",
    status: "delivered",
    items: [
      { name: "Chicken Malai Tikka", quantity: 2, price: 420, total: 840 },
      { name: "Subz Dum Biryani", quantity: 2, price: 380, total: 760 },
      { name: "Fresh Lime Soda (Sweet/Salt)", quantity: 4, price: 120, total: 480 }
    ],
    subtotal: 2080,
    taxAmount: 104,
    totalAmount: 2184,
    customerName: "Pooja Mehta",
    createdAt: daysAgo(2, 19, 40),
  },

  // 1 Day Ago (Yesterday)
  {
    orderNumber: "ORD-20261102-001",
    tableNumber: "T-02",
    orderType: "dine-in",
    status: "delivered",
    items: [
      { name: "Paneer Tikka Angara", quantity: 2, price: 340, total: 680 },
      { name: "Butter Chicken Grand Cru", quantity: 1, price: 490, total: 490 },
      { name: "Garlic Butter Naan", quantity: 5, price: 90, total: 450 },
      { name: "Kesari Rasmalai Supreme", quantity: 2, price: 180, total: 360 }
    ],
    subtotal: 1980,
    taxAmount: 99,
    totalAmount: 2079,
    customerName: "Aarav Gupta",
    createdAt: daysAgo(1, 13, 20),
  },
  {
    orderNumber: "ORD-20261102-002",
    tableNumber: "VIP-2",
    orderType: "dine-in",
    status: "delivered",
    items: [
      { name: "Mutton Seekh Kebab Peshawari", quantity: 3, price: 480, total: 1440 },
      { name: "Dum Biryani (Chicken)", quantity: 3, price: 460, total: 1380 },
      { name: "Virgin Mojito Splash", quantity: 4, price: 180, total: 720 },
      { name: "Gulab Jamun with Ice Cream", quantity: 3, price: 160, total: 480 }
    ],
    subtotal: 4020,
    taxAmount: 201,
    totalAmount: 4221,
    customerName: "Vikram Singhania",
    createdAt: daysAgo(1, 20, 45),
  },

  // Today (Active Live Orders)
  {
    orderNumber: "ORD-1001",
    tableNumber: "T-02",
    orderType: "dine-in",
    status: "preparing",
    items: [
      { name: "Paneer Tikka Angara", quantity: 2, price: 340, total: 680 },
      { name: "Garlic Butter Naan", quantity: 4, price: 90, total: 360 },
      { name: "Dal Makhani Royal", quantity: 1, price: 360, total: 360 },
    ],
    subtotal: 1400,
    taxAmount: 70,
    totalAmount: 1470,
    customerName: "Aarav Gupta",
    customerPhone: "+91 9988776655",
    createdAt: today,
  },
  {
    orderNumber: "ORD-1002",
    tableNumber: "G-02",
    orderType: "dine-in",
    status: "ready",
    items: [
      { name: "Chicken Malai Tikka", quantity: 1, price: 420, total: 420 },
      { name: "Butter Chicken Grand Cru", quantity: 1, price: 490, total: 490 },
      { name: "Garlic Butter Naan", quantity: 3, price: 90, total: 270 },
      { name: "Virgin Mojito Splash", quantity: 2, price: 180, total: 360 },
    ],
    subtotal: 1540,
    taxAmount: 77,
    totalAmount: 1617,
    customerName: "Rohan Verma",
    customerPhone: "+91 9765432190",
    createdAt: today,
  }
];

// -------------------------------------------------------------
// 13. Authoritative Bills / Invoices (Schema V2 with integer paise)
// -------------------------------------------------------------
const sampleBills = [
  {
    _id: new ObjectId("6724a8000000000000000001"),
    billNumber: "INV-20261028-000101",
    orderNumber: "ORD-20261028-001",
    tableName: "T-01",
    customerName: "Aarav Gupta",
    customerPhone: "+91 9988776655",
    schemaVersion: 2,
    subtotalPaise: 140000,
    discountPaise: 0,
    taxPaise: 7000,
    grandTotalPaise: 147000,
    paidAmountPaise: 147000,
    balanceDuePaise: 0,
    totalAmount: 1470,
    paymentStatus: "paid",
    paymentMethod: "upi",
    billPay: true,
    isSettled: true,
    settlementNumber: "SBILL-20261028-000001",
    issueDate: daysAgo(6, 14, 0),
    createdAt: daysAgo(6, 14, 0),
    items: [
      { name: "Paneer Tikka Angara", quantity: 2, unitPricePaise: 34000, grossAmountPaise: 68000, discountPaise: 0, netAmountPaise: 68000, taxPaise: 3400 },
      { name: "Dal Makhani Royal", quantity: 1, unitPricePaise: 36000, grossAmountPaise: 36000, discountPaise: 0, netAmountPaise: 36000, taxPaise: 1800 },
      { name: "Garlic Butter Naan", quantity: 4, unitPricePaise: 9000, grossAmountPaise: 36000, discountPaise: 0, netAmountPaise: 36000, taxPaise: 1800 }
    ]
  },
  {
    _id: new ObjectId("6724a8000000000000000002"),
    billNumber: "INV-20261028-000102",
    orderNumber: "ORD-20261028-002",
    tableName: "R-01",
    customerName: "Pooja Mehta",
    customerPhone: "+91 9811223344",
    schemaVersion: 2,
    subtotalPaise: 230000,
    discountPaise: 0,
    taxPaise: 11500,
    grandTotalPaise: 241500,
    paidAmountPaise: 241500,
    balanceDuePaise: 0,
    totalAmount: 2415,
    paymentStatus: "paid",
    paymentMethod: "card",
    billPay: true,
    isSettled: true,
    settlementNumber: "SBILL-20261028-000001",
    issueDate: daysAgo(6, 21, 15),
    createdAt: daysAgo(6, 21, 15),
    items: [
      { name: "Chicken Malai Tikka", quantity: 2, unitPricePaise: 42000, grossAmountPaise: 84000, discountPaise: 0, netAmountPaise: 84000, taxPaise: 4200 },
      { name: "Dum Biryani (Chicken)", quantity: 2, unitPricePaise: 46000, grossAmountPaise: 92000, discountPaise: 0, netAmountPaise: 92000, taxPaise: 4600 },
      { name: "Virgin Mojito Splash", quantity: 3, unitPricePaise: 18000, grossAmountPaise: 54000, discountPaise: 0, netAmountPaise: 54000, taxPaise: 2700 }
    ]
  },
  {
    _id: new ObjectId("6724a8000000000000000003"),
    billNumber: "INV-20261029-000103",
    orderNumber: "ORD-20261029-001",
    tableName: "G-01",
    customerName: "Rohan Verma",
    customerPhone: "+91 9765432190",
    schemaVersion: 2,
    subtotalPaise: 184000,
    discountPaise: 0,
    taxPaise: 9200,
    grandTotalPaise: 193200,
    paidAmountPaise: 193200,
    balanceDuePaise: 0,
    totalAmount: 1932,
    paymentStatus: "paid",
    paymentMethod: "cash",
    billPay: true,
    isSettled: true,
    settlementNumber: "SBILL-20261029-000002",
    issueDate: daysAgo(5, 15, 0),
    createdAt: daysAgo(5, 15, 0),
    items: [
      { name: "Butter Chicken Grand Cru", quantity: 2, unitPricePaise: 49000, grossAmountPaise: 98000, discountPaise: 0, netAmountPaise: 98000, taxPaise: 4900 },
      { name: "Garlic Butter Naan", quantity: 6, unitPricePaise: 9000, grossAmountPaise: 54000, discountPaise: 0, netAmountPaise: 54000, taxPaise: 2700 },
      { name: "Gulab Jamun with Ice Cream", quantity: 2, unitPricePaise: 16000, grossAmountPaise: 32000, discountPaise: 0, netAmountPaise: 32000, taxPaise: 1600 }
    ]
  },
  {
    _id: new ObjectId("6724a8000000000000000004"),
    billNumber: "INV-20261102-000104",
    orderNumber: "ORD-20261102-001",
    tableName: "T-02",
    customerName: "Aarav Gupta",
    customerPhone: "+91 9988776655",
    schemaVersion: 2,
    subtotalPaise: 198000,
    discountPaise: 10000, // ₹100 manager approved discount
    taxPaise: 9400,
    grandTotalPaise: 197400,
    paidAmountPaise: 197400,
    balanceDuePaise: 0,
    totalAmount: 1974,
    paymentStatus: "paid",
    paymentMethod: "split", // Cash + UPI
    billPay: true,
    isSettled: true,
    settlementNumber: "SBILL-20261102-000005",
    issueDate: daysAgo(1, 14, 0),
    createdAt: daysAgo(1, 14, 0),
    items: [
      { name: "Paneer Tikka Angara", quantity: 2, unitPricePaise: 34000, grossAmountPaise: 68000, discountPaise: 0, netAmountPaise: 68000, taxPaise: 3400 },
      { name: "Butter Chicken Grand Cru", quantity: 1, unitPricePaise: 49000, grossAmountPaise: 49000, discountPaise: 0, netAmountPaise: 49000, taxPaise: 2450 },
      { name: "Garlic Butter Naan", quantity: 5, unitPricePaise: 9000, grossAmountPaise: 45000, discountPaise: 0, netAmountPaise: 45000, taxPaise: 2250 },
      { name: "Kesari Rasmalai Supreme", quantity: 2, unitPricePaise: 18000, grossAmountPaise: 36000, discountPaise: 0, netAmountPaise: 36000, taxPaise: 1800 }
    ]
  },
  {
    _id: new ObjectId("6724a8000000000000000005"),
    billNumber: "INV-20261103-000105",
    orderNumber: "ORD-1002",
    tableName: "G-02",
    customerName: "Rohan Verma",
    customerPhone: "+91 9765432190",
    schemaVersion: 2,
    subtotalPaise: 154000,
    discountPaise: 0,
    taxPaise: 7700,
    grandTotalPaise: 161700,
    paidAmountPaise: 0,
    balanceDuePaise: 161700,
    totalAmount: 1617,
    paymentStatus: "unpaid",
    billPay: false,
    isSettled: false,
    issueDate: today,
    createdAt: today,
    items: [
      { name: "Chicken Malai Tikka", quantity: 1, unitPricePaise: 42000, grossAmountPaise: 42000, discountPaise: 0, netAmountPaise: 42000, taxPaise: 2100 },
      { name: "Butter Chicken Grand Cru", quantity: 1, unitPricePaise: 49000, grossAmountPaise: 49000, discountPaise: 0, netAmountPaise: 49000, taxPaise: 2450 },
      { name: "Garlic Butter Naan", quantity: 3, unitPricePaise: 9000, grossAmountPaise: 27000, discountPaise: 0, netAmountPaise: 27000, taxPaise: 1350 },
      { name: "Virgin Mojito Splash", quantity: 2, unitPricePaise: 18000, grossAmountPaise: 36000, discountPaise: 0, netAmountPaise: 36000, taxPaise: 1800 }
    ]
  }
];

// -------------------------------------------------------------
// 14. Dedicated Payments & Receipts (REC-...)
// -------------------------------------------------------------
const samplePayments = [
  {
    receiptNumber: "REC-20261028-000001",
    invoiceId: sampleBills[0]._id,
    billNumber: sampleBills[0].billNumber,
    tender: "upi",
    amountPaise: 147000,
    reference: "UPI/YESB/789012345",
    recordedAt: daysAgo(6, 14, 1),
    createdAt: daysAgo(6, 14, 1),
  },
  {
    receiptNumber: "REC-20261028-000002",
    invoiceId: sampleBills[1]._id,
    billNumber: sampleBills[1].billNumber,
    tender: "card",
    amountPaise: 241500,
    reference: "HDFC-POS-AUTH-4412",
    recordedAt: daysAgo(6, 21, 16),
    createdAt: daysAgo(6, 21, 16),
  },
  {
    receiptNumber: "REC-20261029-000003",
    invoiceId: sampleBills[2]._id,
    billNumber: sampleBills[2].billNumber,
    tender: "cash",
    amountPaise: 193200,
    cashTenderedPaise: 200000,
    changeReturnedPaise: 6800,
    recordedAt: daysAgo(5, 15, 2),
    createdAt: daysAgo(5, 15, 2),
  },
  {
    receiptNumber: "REC-20261102-000004",
    invoiceId: sampleBills[3]._id,
    billNumber: sampleBills[3].billNumber,
    tender: "cash",
    amountPaise: 100000, // ₹1,000 cash split
    recordedAt: daysAgo(1, 14, 2),
    createdAt: daysAgo(1, 14, 2),
  },
  {
    receiptNumber: "REC-20261102-000005",
    invoiceId: sampleBills[3]._id,
    billNumber: sampleBills[3].billNumber,
    tender: "upi",
    amountPaise: 97400, // ₹974 UPI split
    reference: "UPI/PAYTM/99881122",
    recordedAt: daysAgo(1, 14, 3),
    createdAt: daysAgo(1, 14, 3),
  }
];

// -------------------------------------------------------------
// 15. Register Sessions & Cash Movements
// -------------------------------------------------------------
const registerSessions = [
  // Yesterday's Closed Session
  {
    _id: new ObjectId("6724a9000000000000000001"),
    sessionNumber: "SES-20261102-000001",
    registerId: "REG-01",
    cashierId: staff[2]._id,
    cashierName: staff[2].name,
    status: "closed",
    openedAt: daysAgo(1, 10, 0),
    closedAt: daysAgo(1, 23, 30),
    openingFloatPaise: 500000, // ₹5,000.00
    cashSalesPaise: 293200,    // ₹2,932.00
    cashRefundsPaise: 0,
    cashInPaise: 0,
    cashOutPaise: 145000,      // ₹1,450.00 petty cash expense
    expectedDrawerPaise: 648200, // 5000 + 2932 - 1450 = ₹6,482.00
    actualCountedPaise: 648200,
    variancePaise: 0,
    denominations: {
      "500": 10, // 5000
      "200": 5,  // 1000
      "100": 4,  // 400
      "50": 1,   // 50
      "20": 1,   // 20
      "10": 1,   // 10
      "2": 1     // 2
    },
    notes: "Session closed cleanly. Perfect cash drawer match.",
    createdAt: daysAgo(1, 10, 0),
  },
  // Today's Open Active Session
  {
    _id: new ObjectId("6724a9000000000000000002"),
    sessionNumber: "SES-20261103-000002",
    registerId: "REG-01",
    cashierId: staff[2]._id,
    cashierName: staff[2].name,
    status: "open",
    openedAt: new Date(new Date().setHours(10, 0, 0, 0)),
    openingFloatPaise: 500000, // ₹5,000.00
    cashSalesPaise: 0,
    cashRefundsPaise: 0,
    cashInPaise: 0,
    cashOutPaise: 82000, // ₹820 emergency herbs
    expectedDrawerPaise: 418000,
    createdAt: today,
  }
];

// -------------------------------------------------------------
// 16. Customer Feedbacks
// -------------------------------------------------------------
const feedbacks = [
  {
    food: "5",
    service: "5",
    cleanliness: "5",
    money: "5",
    staff: "5",
    email: "aarav.gupta@example.com",
    suggestion: "Exceptional Butter Chicken and Garlic Naan! The ambiance and quick service made our family dinner memorable.",
    createdAt: daysAgo(1, 15, 30).toISOString(),
  },
  {
    food: "5",
    service: "4",
    cleanliness: "5",
    money: "4",
    staff: "5",
    email: "pooja.mehta@example.com",
    suggestion: "Tandoori starters were mouth-watering. Great cocktail selection on the rooftop.",
    createdAt: daysAgo(2, 21, 0).toISOString(),
  },
  {
    food: "4",
    service: "5",
    cleanliness: "5",
    money: "4",
    staff: "5",
    email: "dr.verma@vermaclinic.org",
    suggestion: "VIP Cabana service was top-notch. Staff was courteous and attentive to dietary requests.",
    createdAt: daysAgo(5, 22, 30).toISOString(),
  }
];

// -------------------------------------------------------------
// 17. Taxes
// -------------------------------------------------------------
const taxes = [
  {
    name: "GST 5% (Restaurant - CGST 2.5% + SGST 2.5%)",
    rate: 5,
    type: "percentage",
    active: true,
    description: "Standard restaurant dining GST without input tax credit",
    createdAt: daysAgo(30),
  },
  {
    name: "Liquor VAT 18%",
    rate: 18,
    type: "percentage",
    active: true,
    description: "Applicable on alcoholic beverages and bar service",
    createdAt: daysAgo(30),
  },
  {
    name: "Optional Service Charge 5%",
    rate: 5,
    type: "percentage",
    active: false,
    description: "Discretionary hospitality service charge",
    createdAt: daysAgo(30),
  }
];

// -------------------------------------------------------------
// 18. Settings
// -------------------------------------------------------------
const settingsDoc = {
  general: {
    restaurantName: "Hotel-POS Luxury & Fine Dining",
    address: "101 Grand Boulevard, Central City Plaza",
    phone: "+91 98765 43210",
    email: "contact@hotel-pos.com",
    currency: "INR",
    currencySymbol: "₹",
    timezone: "Asia/Kolkata",
    language: "en",
    gst: "GSTIN08AAACA1234F1Z9",
    fssai: "12345678901234",
    adminName: "Hotel General Manager",
  },
  pos: {
    taxRate: 5,
    serviceCharge: 0,
    autoGenerateKOT: true,
    soundEnabled: true,
    receiptFooter: "Thank you for dining with us! We hope to welcome you back soon.",
    printerIP: "192.168.1.100",
  },
  notifications: {
    pushNotifications: false,
    emailNotifications: true,
    smsNotifications: false,
    lowStockAlerts: true,
    orderAlerts: true,
  },
  integrations: {
    printerIP: "192.168.1.100",
    paymentGateway: "UPI / Card / Cash",
    emailProvider: "Nodemailer SMTP",
  }
};

module.exports = {
  staff,
  outlets,
  tables,
  categories,
  menuItems,
  inventory,
  suppliers,
  purchases,
  expenses,
  debtors,
  customers,
  sampleOrders,
  sampleBills,
  samplePayments,
  registerSessions,
  feedbacks,
  taxes,
  settingsDoc
};


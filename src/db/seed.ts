/**
 * Seed script — populates realistic sample data for DesignandDesireStudio.
 * Run with: npm run db:seed
 * Sample rows are flagged isSample=true so they are visually distinguishable
 * from genuine company records in the UI.
 */
import { mkdirSync } from "fs";
mkdirSync("./data", { recursive: true });

import bcrypt from "bcryptjs";
import { db } from "./index";
import {
  users,
  leads,
  clients,
  projects,
  tasks,
  moodboards,
  moodboardItems,
  materials,
  vendors,
  purchaseOrders,
  quotations,
  quotationItems,
  documents,
  activities,
  notifications,
} from "./schema";
import { IMG, MATERIAL_IMG, MOOD_IMG, AVATARS } from "./images";
import { createId } from "@/lib/id";

const daysFromNow = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
};

async function seed() {
  console.log("🌱 Seeding DesignandDesireStudio CRM…");

  // Clear everything (fresh deterministic seed)
  await db.delete(quotationItems);
  await db.delete(quotations);
  await db.delete(moodboardItems);
  await db.delete(moodboards);
  await db.delete(purchaseOrders);
  await db.delete(tasks);
  await db.delete(documents);
  await db.delete(notifications);
  await db.delete(activities);
  await db.delete(materials);
  await db.delete(projects);
  await db.delete(clients);
  await db.delete(leads);
  await db.delete(vendors);
  await db.delete(users);

  const pw = await bcrypt.hash("Welcome@123", 10);

  /* ---------------------------- Users ---------------------------- */
  const adminId = createId();
  const pm1 = createId();
  const des1 = createId();
  const des2 = createId();
  const proc1 = createId();
  const fin1 = createId();

  await db.insert(users).values([
    {
      id: adminId,
      name: "Studio Admin",
      email: "designanddesirestudio@gmail.com",
      passwordHash: pw,
      role: "admin",
      title: "Founder & Principal Designer",
      avatarUrl: AVATARS[0],
      phone: "+91 98450 10101",
      isSample: false,
    },
    { id: pm1, name: "Rohan Mehta", email: "rohan@designanddesire.studio", passwordHash: pw, role: "project_manager", title: "Senior Project Manager", avatarUrl: AVATARS[1], phone: "+91 98450 22202", isSample: true },
    { id: des1, name: "Ananya Rao", email: "ananya@designanddesire.studio", passwordHash: pw, role: "designer", title: "Lead Interior Designer", avatarUrl: AVATARS[2], phone: "+91 98450 33303", isSample: true },
    { id: des2, name: "Kabir Nair", email: "kabir@designanddesire.studio", passwordHash: pw, role: "designer", title: "Interior Designer", avatarUrl: AVATARS[3], phone: "+91 98450 44404", isSample: true },
    { id: proc1, name: "Priya Shetty", email: "priya@designanddesire.studio", passwordHash: pw, role: "procurement_manager", title: "Procurement Lead", avatarUrl: AVATARS[4], phone: "+91 98450 55505", isSample: true },
    { id: fin1, name: "Arjun Desai", email: "arjun@designanddesire.studio", passwordHash: pw, role: "finance_manager", title: "Finance Manager", avatarUrl: AVATARS[0], phone: "+91 98450 66606", isSample: true },
  ]);

  /* --------------------------- Vendors --------------------------- */
  const vMarble = createId(), vFurniture = createId(), vLighting = createId(), vFabric = createId(), vModular = createId();
  await db.insert(vendors).values([
    { id: vMarble, name: "Stonex Marble House", company: "Stonex Exports Pvt Ltd", contactPerson: "Imran Sheikh", phone: "+91 80 4122 3344", email: "sales@stonex.in", address: "Hosur Road, Bengaluru", gstin: "29ABCDE1234F1Z5", categories: "Marble & Granite,Tiles,Flooring", paymentTerms: "50% advance, 50% on delivery", rating: 4.6, isSample: true },
    { id: vFurniture, name: "Heritage Woodcraft", company: "Heritage Interiors LLP", contactPerson: "Suresh Kamath", phone: "+91 80 2556 7788", email: "orders@heritagewood.in", address: "Peenya Industrial Area, Bengaluru", gstin: "29HERIT5678G1Z2", categories: "Furniture,Wood & Veneers", paymentTerms: "Net 30", rating: 4.8, isSample: true },
    { id: vLighting, name: "Lumina Lighting Studio", company: "Lumina Retail Pvt Ltd", contactPerson: "Neha Kulkarni", phone: "+91 80 4567 1212", email: "hello@luminastudio.in", address: "Indiranagar, Bengaluru", gstin: "29LUMIN9012H1Z8", categories: "Lighting,Decorative Items", paymentTerms: "100% advance", rating: 4.4, isSample: true },
    { id: vFabric, name: "Weave & Warp Textiles", company: "Weave & Warp", contactPerson: "Fatima Khan", phone: "+91 80 3344 9900", email: "textiles@weavewarp.in", address: "Commercial Street, Bengaluru", gstin: "29WEAVE3456J1Z1", categories: "Fabrics,Curtains,Upholstery", paymentTerms: "Net 15", rating: 4.2, isSample: true },
    { id: vModular, name: "FormKitchen Modular", company: "FormKitchen Pvt Ltd", contactPerson: "Vikram Hegde", phone: "+91 80 6677 8899", email: "projects@formkitchen.in", address: "Whitefield, Bengaluru", gstin: "29FORMK7890K1Z4", categories: "Kitchen Accessories,Hardware,Furniture", paymentTerms: "40% advance, 60% on install", rating: 4.7, isSample: true },
  ]);

  /* --------------------------- Clients --------------------------- */
  const cCooper = createId(), cMoort = createId(), cWhitefield = createId(), cIndira = createId(), cProspect = createId();
  await db.insert(clients).values([
    { id: cCooper, name: "Daniel & Sarah Cooper", email: "cooper.family@email.com", phone: "+91 99000 11111", company: null, address: "Prestige Golfshire, Nandi Hills Road", city: "Bengaluru", propertyType: "Luxury Villa", propertyDetails: "5BHK villa, 6200 sq ft, triple height living", budgetPreference: 18500000, designPreferences: "Luxury Classic with warm neutral palette", status: "active", avatarUrl: AVATARS[1], isSample: true },
    { id: cMoort, name: "Aditya Moort", email: "aditya.moort@email.com", phone: "+91 99000 22222", address: "Vijayanagar 2nd Stage", city: "Mysuru", propertyType: "Contemporary Apartment", propertyDetails: "3BHK apartment, 1850 sq ft", budgetPreference: 4200000, designPreferences: "Contemporary, open plan, lots of natural light", status: "active", avatarUrl: AVATARS[2], isSample: true },
    { id: cWhitefield, name: "Meera Krishnan", email: "meera.k@email.com", phone: "+91 99000 33333", address: "Palm Meadows, Whitefield", city: "Bengaluru", propertyType: "Independent House", propertyDetails: "4BHK, 3400 sq ft, modern minimalist brief", budgetPreference: 9800000, designPreferences: "Modern Minimalist, muted tones, clean lines", status: "active", avatarUrl: AVATARS[3], isSample: true },
    { id: cIndira, name: "Rahul & Divya Menon", email: "menon.rd@email.com", phone: "+91 99000 44444", address: "1st Cross, Indiranagar", city: "Bengaluru", propertyType: "Penthouse", propertyDetails: "Premium penthouse, 2900 sq ft, terrace garden", budgetPreference: 12500000, designPreferences: "Luxury contemporary, statement lighting", status: "active", avatarUrl: AVATARS[4], isSample: true },
    { id: cProspect, name: "Nikhil Agarwal", email: "nikhil.a@email.com", phone: "+91 99000 55555", address: "Sarjapur Road", city: "Bengaluru", propertyType: "Apartment", propertyDetails: "2BHK, 1200 sq ft", budgetPreference: 2500000, designPreferences: "Scandinavian", status: "prospect", avatarUrl: AVATARS[0], isSample: true },
  ]);

  /* --------------------------- Projects -------------------------- */
  const pCooper = createId(), pMoort = createId(), pWhitefield = createId(), pIndira = createId(), pNik = createId(), pCafe = createId();
  await db.insert(projects).values([
    { id: pCooper, name: "The Cooper Residence", clientId: cCooper, projectType: "Luxury Villa", propertyAddress: "Prestige Golfshire, Nandi Hills Road", location: "Bengaluru", propertyArea: 6200, coverImage: IMG.villa, budget: 16500000, contractValue: 18500000, budgetConsumed: 11200000, completion: 68, startDate: daysFromNow(-120), expectedCompletion: daysFromNow(45), nextDeadline: daysFromNow(6), projectManagerId: pm1, stage: "execution", status: "in_progress", description: "Full turnkey interior for a 5BHK luxury villa with triple-height living room, home theatre and landscaped terrace.", sortOrder: 0, isSample: true },
    { id: pIndira, name: "The Indiranagar Penthouse", clientId: cIndira, projectType: "Premium Residential", propertyAddress: "1st Cross, Indiranagar", location: "Bengaluru", propertyArea: 2900, coverImage: IMG.penthouse, budget: 11000000, contractValue: 12500000, budgetConsumed: 5400000, completion: 44, startDate: daysFromNow(-70), expectedCompletion: daysFromNow(80), nextDeadline: daysFromNow(3), projectManagerId: pm1, stage: "procurement", status: "in_progress", description: "Premium penthouse interior with statement lighting, Italian marble flooring and a terrace garden lounge.", sortOrder: 0, isSample: true },
    { id: pWhitefield, name: "The Whitefield Residence", clientId: cWhitefield, projectType: "Modern Minimalist Home", propertyAddress: "Palm Meadows, Whitefield", location: "Bengaluru", propertyArea: 3400, coverImage: IMG.livingModern, budget: 9000000, contractValue: 9800000, budgetConsumed: 2100000, completion: 28, startDate: daysFromNow(-40), expectedCompletion: daysFromNow(110), nextDeadline: daysFromNow(9), projectManagerId: pm1, stage: "concept_design", status: "in_progress", description: "Modern minimalist 4BHK home with muted palette, concealed storage and warm oak accents.", sortOrder: 0, isSample: true },
    { id: pMoort, name: "The Moort Apartment", clientId: cMoort, projectType: "Contemporary Apartment", propertyAddress: "Vijayanagar 2nd Stage", location: "Mysuru", propertyArea: 1850, coverImage: IMG.livingWarm, budget: 3800000, contractValue: 4200000, budgetConsumed: 320000, completion: 12, startDate: daysFromNow(-18), expectedCompletion: daysFromNow(120), nextDeadline: daysFromNow(2), projectManagerId: pm1, stage: "concept_design", status: "in_progress", description: "Contemporary 3BHK apartment with open-plan living and a compact modular kitchen.", sortOrder: 1, isSample: true },
    { id: pNik, name: "Agarwal Scandi Nest", clientId: cProspect, projectType: "Apartment", propertyAddress: "Sarjapur Road", location: "Bengaluru", propertyArea: 1200, coverImage: IMG.bedroom1, budget: 2300000, contractValue: 2500000, budgetConsumed: 0, completion: 2, startDate: daysFromNow(-4), expectedCompletion: daysFromNow(150), nextDeadline: daysFromNow(5), projectManagerId: des1, stage: "initial_enquiry", status: "in_progress", description: "Compact 2BHK Scandinavian makeover — light woods, white walls, cozy textures.", sortOrder: 0, isSample: true },
    { id: pCafe, name: "Brew & Bloom Café", clientId: cWhitefield, projectType: "Commercial Fit-out", propertyAddress: "100 Ft Road, Indiranagar", location: "Bengaluru", propertyArea: 1600, coverImage: IMG.diningRoom, budget: 5200000, contractValue: 5600000, budgetConsumed: 5600000, completion: 100, startDate: daysFromNow(-210), expectedCompletion: daysFromNow(-30), nextDeadline: null, projectManagerId: pm1, stage: "execution", status: "completed", description: "Boutique café fit-out with industrial-warm theme, custom joinery and feature lighting.", sortOrder: 2, isSample: true },
  ]);

  /* ----------------------------- Leads --------------------------- */
  await db.insert(leads).values([
    { id: createId(), fullName: "Sanjay Gupta", phone: "+91 98111 20001", email: "sanjay.g@email.com", location: "Koramangala, Bengaluru", propertyType: "Apartment", propertySize: 1600, estimatedBudget: 3200000, designStyle: "Contemporary", serviceRequired: "Full Home Interior", source: "Instagram", assignedDesignerId: des1, enquiryDate: daysFromNow(-2), followUpDate: daysFromNow(2), status: "new", notes: "Saw our Indiranagar project on Instagram. Keen on a quick consultation.", isSample: true },
    { id: createId(), fullName: "Lakshmi Iyer", phone: "+91 98111 20002", email: "lakshmi.iyer@email.com", location: "JP Nagar, Bengaluru", propertyType: "Villa", propertySize: 3800, estimatedBudget: 9500000, designStyle: "Luxury Classic", serviceRequired: "Turnkey Project", source: "Referral", assignedDesignerId: des2, enquiryDate: daysFromNow(-6), followUpDate: daysFromNow(1), status: "consultation_scheduled", notes: "Referred by the Cooper family. Site visit scheduled.", isSample: true },
    { id: createId(), fullName: "Vivek Reddy", phone: "+91 98111 20003", email: "vivek.reddy@email.com", location: "Gachibowli, Hyderabad", propertyType: "Penthouse", propertySize: 2600, estimatedBudget: 11000000, designStyle: "Modern Minimalist", serviceRequired: "Full Home Interior", source: "Website", assignedDesignerId: des1, enquiryDate: daysFromNow(-10), followUpDate: daysFromNow(3), status: "proposal_sent", notes: "Proposal shared. Awaiting feedback on moodboard direction.", isSample: true },
    { id: createId(), fullName: "Farah Qureshi", phone: "+91 98111 20004", email: "farah.q@email.com", location: "Frazer Town, Bengaluru", propertyType: "Independent House", propertySize: 2400, estimatedBudget: 5500000, designStyle: "Indian Traditional", serviceRequired: "Renovation", source: "Google Ads", assignedDesignerId: des2, enquiryDate: daysFromNow(-14), followUpDate: daysFromNow(4), status: "negotiation", notes: "Negotiating scope — wants to phase the work across two stages.", isSample: true },
    { id: createId(), fullName: "Thomas Mathew", phone: "+91 98111 20005", email: "thomas.m@email.com", location: "Kochi, Kerala", propertyType: "Apartment", propertySize: 1400, estimatedBudget: 2800000, designStyle: "Scandinavian", serviceRequired: "Living Room Design", source: "Exhibition", assignedDesignerId: des1, enquiryDate: daysFromNow(-20), followUpDate: daysFromNow(-1), status: "contacted", notes: "Met at the Interior Expo. Budget-conscious but serious.", isSample: true },
    { id: createId(), fullName: "Ritu Bhardwaj", phone: "+91 98111 20006", email: "ritu.b@email.com", location: "Electronic City, Bengaluru", propertyType: "Apartment", propertySize: 1100, estimatedBudget: 1800000, designStyle: "Modern Minimalist", serviceRequired: "Modular Kitchen", source: "Walk-in", assignedDesignerId: des2, enquiryDate: daysFromNow(-30), followUpDate: null, status: "lost", notes: "Went with a cheaper local contractor.", isSample: true },
    { id: createId(), fullName: "Nikhil Agarwal", phone: "+91 99000 55555", email: "nikhil.a@email.com", location: "Sarjapur Road, Bengaluru", propertyType: "Apartment", propertySize: 1200, estimatedBudget: 2500000, designStyle: "Scandinavian", serviceRequired: "Full Home Interior", source: "Website", assignedDesignerId: des1, enquiryDate: daysFromNow(-25), followUpDate: null, status: "won", notes: "Won — converted to the Agarwal Scandi Nest project.", convertedClientId: cProspect, isSample: true },
  ]);

  /* ---------------------------- Materials ------------------------ */
  await db.insert(materials).values([
    { id: createId(), name: "Statuario Italian Marble", category: "Marble & Granite", brand: "Stonex", vendorId: vMarble, imageUrl: MATERIAL_IMG.marble, sku: "MRB-STAT-001", unit: "sq ft", costPrice: 420, sellingPrice: 650, availability: "in_stock", specifications: "18mm, polished finish, book-matched slabs", color: "White / Grey veining", finish: "Polished", dimensions: "9x5 ft slab", isSample: true },
    { id: createId(), name: "Smoked Oak Veneer", category: "Wood & Veneers", brand: "Heritage", vendorId: vFurniture, imageUrl: MATERIAL_IMG.wood, sku: "VNR-OAK-014", unit: "sheet", costPrice: 3200, sellingPrice: 4800, availability: "in_stock", specifications: "8x4 ft, 1mm natural veneer on MDF", color: "Smoked brown", finish: "Matte lacquer", dimensions: "8x4 ft", isSample: true },
    { id: createId(), name: "Carrara Matte Tile", category: "Tiles", brand: "Kajaria", vendorId: vMarble, imageUrl: MATERIAL_IMG.tiles, sku: "TIL-CAR-600", unit: "box", costPrice: 850, sellingPrice: 1250, availability: "in_stock", specifications: "600x1200mm, rectified, R10 slip rating", color: "White marble-look", finish: "Matte", dimensions: "600x1200mm", isSample: true },
    { id: createId(), name: "Linen Weave Upholstery", category: "Fabrics", brand: "Weave & Warp", vendorId: vFabric, imageUrl: MATERIAL_IMG.fabric, sku: "FAB-LIN-220", unit: "meter", costPrice: 680, sellingPrice: 1100, availability: "made_to_order", specifications: "Heavy linen blend, 300 GSM, stain resistant", color: "Oatmeal", finish: "Natural weave", dimensions: "140cm width", isSample: true },
    { id: createId(), name: "Brass Pendant Cluster", category: "Lighting", brand: "Lumina", vendorId: vLighting, imageUrl: MATERIAL_IMG.lighting, sku: "LGT-BRS-009", unit: "unit", costPrice: 12500, sellingPrice: 19500, availability: "made_to_order", specifications: "7-light cluster, dimmable, warm 2700K LED", color: "Antique brass", finish: "Brushed", dimensions: "900mm drop", isSample: true },
    { id: createId(), name: "Clay Lime Wash Paint", category: "Paint", brand: "Asian Paints", vendorId: null, imageUrl: MATERIAL_IMG.paint, sku: "PNT-CLW-330", unit: "litre", costPrice: 520, sellingPrice: 780, availability: "in_stock", specifications: "Breathable mineral lime wash, matte", color: "Warm sand", finish: "Textured matte", dimensions: "20L bucket", isSample: true },
    { id: createId(), name: "Walnut Lounge Chair", category: "Furniture", brand: "Heritage", vendorId: vFurniture, imageUrl: MATERIAL_IMG.furniture, sku: "FUR-WLC-055", unit: "unit", costPrice: 28000, sellingPrice: 42000, availability: "made_to_order", specifications: "Solid walnut frame, bouclé seat", color: "Walnut / Cream", finish: "Oiled", dimensions: "78x82x90 cm", isSample: true },
    { id: createId(), name: "Herringbone Oak Flooring", category: "Flooring", brand: "Pergo", vendorId: vMarble, imageUrl: MATERIAL_IMG.flooring, sku: "FLR-HBO-120", unit: "sq ft", costPrice: 290, sellingPrice: 460, availability: "in_stock", specifications: "Engineered oak, click-lock, 14mm", color: "Natural oak", finish: "Brushed matte", dimensions: "600x120mm planks", isSample: true },
    { id: createId(), name: "Textured Grasscloth Wallpaper", category: "Wallpaper", brand: "Nilaya", vendorId: vFabric, imageUrl: MATERIAL_IMG.wallpaper, sku: "WLP-GRS-078", unit: "roll", costPrice: 4200, sellingPrice: 6500, availability: "in_stock", specifications: "Natural grasscloth, paste-the-wall", color: "Sand beige", finish: "Textured", dimensions: "10m x 0.9m roll", isSample: true },
    { id: createId(), name: "Matte Black Cabinet Handles", category: "Hardware", brand: "Hettich", vendorId: vModular, imageUrl: MATERIAL_IMG.hardware, sku: "HDW-BLK-200", unit: "piece", costPrice: 180, sellingPrice: 320, availability: "in_stock", specifications: "Aluminium, 192mm, soft matte coat", color: "Matte black", finish: "Powder coat", dimensions: "192mm", isSample: true },
    { id: createId(), name: "Sheer Linen Drapery", category: "Curtains", brand: "Weave & Warp", vendorId: vFabric, imageUrl: MATERIAL_IMG.curtains, sku: "CUR-SHR-045", unit: "meter", costPrice: 420, sellingPrice: 690, availability: "in_stock", specifications: "Sheer linen, light filtering", color: "Ivory", finish: "Sheer", dimensions: "280cm drop", isSample: true },
    { id: createId(), name: "Black Galaxy Granite", category: "Marble & Granite", brand: "Stonex", vendorId: vMarble, imageUrl: MATERIAL_IMG.granite, sku: "GRN-BLK-301", unit: "sq ft", costPrice: 190, sellingPrice: 310, availability: "in_stock", specifications: "18mm, mirror-polished countertop grade", color: "Black with gold fleck", finish: "Polished", dimensions: "8x4 ft slab", isSample: true },
  ]);

  /* --------------------------- Moodboards ------------------------ */
  const mbCooperLiving = createId(), mbIndiraMaster = createId(), mbWhitefield = createId();
  await db.insert(moodboards).values([
    { id: mbCooperLiving, title: "Cooper — Living Room Concept", projectId: pCooper, description: "Warm luxury classic palette with brass accents and travertine.", coverImage: MOOD_IMG[0], room: "Living Room", approvalStatus: "approved", isSample: true },
    { id: mbIndiraMaster, title: "Indiranagar — Master Suite", projectId: pIndira, description: "Moody contemporary master bedroom with statement lighting.", coverImage: MOOD_IMG[3], room: "Master Bedroom", approvalStatus: "changes_requested", isSample: true },
    { id: mbWhitefield, title: "Whitefield — Minimalist Living", projectId: pWhitefield, description: "Muted minimalist palette, warm oak and off-white textures.", coverImage: MOOD_IMG[4], room: "Living Room", approvalStatus: "shared", isSample: true },
  ]);

  const mbItems: (typeof moodboardItems.$inferInsert)[] = [];
  const cats = ["Furniture", "Lighting", "Fabric", "Flooring", "Wall Finish", "Decor"];
  [mbCooperLiving, mbIndiraMaster, mbWhitefield].forEach((mb, bi) => {
    for (let i = 0; i < 6; i++) {
      mbItems.push({
        id: createId(),
        moodboardId: mb,
        imageUrl: MOOD_IMG[(bi * 3 + i) % MOOD_IMG.length],
        label: `${cats[i]} reference`,
        category: cats[i],
        note: i === 0 ? "Primary direction for the space." : null,
        colorHex: ["#D9CBB8", "#1A1715", "#A99A87", "#C8FF36", "#F4EFE5", "#8B6F47"][i],
        sortOrder: i,
      });
    }
  });
  await db.insert(moodboardItems).values(mbItems);

  /* ---------------------------- Tasks ---------------------------- */
  await db.insert(tasks).values([
    { id: createId(), name: "Finalize living room false ceiling design", description: "Coordinate with electrical for cove lighting layout.", projectId: pCooper, assigneeId: des1, priority: "high", startDate: daysFromNow(-5), dueDate: daysFromNow(6), status: "in_progress", kind: "task", isSample: true },
    { id: createId(), name: "Site visit — marble installation QC", description: "Inspect Statuario slab installation in foyer.", projectId: pCooper, assigneeId: pm1, priority: "urgent", startDate: daysFromNow(2), dueDate: daysFromNow(2), status: "todo", kind: "site_visit", isSample: true },
    { id: createId(), name: "Client presentation — master suite revision", description: "Walk Menons through revised moodboard.", projectId: pIndira, assigneeId: des1, priority: "high", startDate: daysFromNow(3), dueDate: daysFromNow(3), status: "todo", kind: "meeting", isSample: true },
    { id: createId(), name: "Approve pendant lighting PO", description: "Lumina brass cluster — confirm finish before order.", projectId: pIndira, assigneeId: proc1, priority: "medium", startDate: daysFromNow(-1), dueDate: daysFromNow(1), status: "under_review", kind: "task", isSample: true },
    { id: createId(), name: "Develop concept boards — all rooms", description: "Whitefield minimalist direction, 4 rooms.", projectId: pWhitefield, assigneeId: des2, priority: "high", startDate: daysFromNow(-3), dueDate: daysFromNow(9), status: "in_progress", kind: "task", isSample: true },
    { id: createId(), name: "Measure survey & AutoCAD base", description: "Full site measurement for Moort apartment.", projectId: pMoort, assigneeId: des2, priority: "medium", startDate: daysFromNow(-2), dueDate: daysFromNow(2), status: "completed", kind: "task", isSample: true },
    { id: createId(), name: "Modular kitchen delivery", description: "FormKitchen delivery & install slot.", projectId: pIndira, assigneeId: proc1, priority: "high", startDate: daysFromNow(8), dueDate: daysFromNow(8), status: "todo", kind: "delivery", isSample: true },
    { id: createId(), name: "Upholstery fabric sampling", description: "Shortlist 3 linen options for Cooper sofas.", projectId: pCooper, assigneeId: des1, priority: "low", startDate: daysFromNow(-6), dueDate: daysFromNow(-1), status: "blocked", kind: "task", isSample: true },
  ]);

  /* ------------------------- Purchase Orders --------------------- */
  await db.insert(purchaseOrders).values([
    { id: createId(), poNumber: "PO-2026-041", projectId: pCooper, vendorId: vMarble, title: "Statuario marble — foyer & living", description: "320 sq ft book-matched slabs", quantity: 320, unit: "sq ft", amount: 208000, expectedDelivery: daysFromNow(-10), receivedQuantity: 320, stage: "completed", paymentStatus: "paid", isSample: true },
    { id: createId(), poNumber: "PO-2026-052", projectId: pCooper, vendorId: vFurniture, title: "Custom walnut TV unit & sideboard", description: "Solid walnut joinery", quantity: 2, unit: "unit", amount: 186000, expectedDelivery: daysFromNow(7), receivedQuantity: 0, stage: "in_transit", paymentStatus: "partial", isSample: true },
    { id: createId(), poNumber: "PO-2026-058", projectId: pIndira, vendorId: vLighting, title: "Brass pendant cluster — master suite", description: "7-light dimmable cluster", quantity: 1, unit: "unit", amount: 19500, expectedDelivery: daysFromNow(14), receivedQuantity: 0, stage: "approval_pending", paymentStatus: "unpaid", isSample: true },
    { id: createId(), poNumber: "PO-2026-060", projectId: pIndira, vendorId: vModular, title: "Modular kitchen — Indiranagar", description: "Full modular kitchen with island", quantity: 1, unit: "set", amount: 820000, expectedDelivery: daysFromNow(8), receivedQuantity: 0, stage: "order_placed", paymentStatus: "partial", isSample: true },
    { id: createId(), poNumber: "PO-2026-063", projectId: pWhitefield, vendorId: vFabric, title: "Sheer linen drapery — living & bedrooms", description: "Made to measure", quantity: 48, unit: "meter", amount: 33120, expectedDelivery: daysFromNow(20), receivedQuantity: 0, stage: "quotation_received", paymentStatus: "unpaid", isSample: true },
    { id: createId(), poNumber: "PO-2026-065", projectId: pCooper, vendorId: vLighting, title: "Chandelier — double height living", description: "Custom statement chandelier", quantity: 1, unit: "unit", amount: 145000, expectedDelivery: daysFromNow(3), receivedQuantity: 1, stage: "quality_inspection", paymentStatus: "paid", isSample: true },
  ]);

  /* --------------------- Quotations & Invoices ------------------- */
  const q1 = createId(), q2 = createId(), inv1 = createId(), inv2 = createId(), inv3 = createId();
  await db.insert(quotations).values([
    { id: q1, number: "QT-2026-018", type: "quotation", clientId: cWhitefield, projectId: pWhitefield, issueDate: daysFromNow(-35), dueDate: daysFromNow(-5), subtotal: 9800000, discount: 200000, gstRate: 18, gstAmount: 1728000, total: 11328000, amountPaid: 0, status: "accepted", terms: "50% advance, 30% at procurement, 20% on handover.", isSample: true },
    { id: q2, number: "QT-2026-024", type: "quotation", clientId: cProspect, projectId: pNik, issueDate: daysFromNow(-8), dueDate: daysFromNow(7), subtotal: 2500000, discount: 0, gstRate: 18, gstAmount: 450000, total: 2950000, amountPaid: 0, status: "sent", terms: "40% advance to commence design.", isSample: true },
    { id: inv1, number: "INV-2026-071", type: "invoice", clientId: cCooper, projectId: pCooper, issueDate: daysFromNow(-60), dueDate: daysFromNow(-30), subtotal: 9250000, discount: 0, gstRate: 18, gstAmount: 1665000, total: 10915000, amountPaid: 10915000, status: "paid", terms: "Milestone 1 & 2 — design + procurement advance.", isSample: true },
    { id: inv2, number: "INV-2026-083", type: "invoice", clientId: cIndira, projectId: pIndira, issueDate: daysFromNow(-20), dueDate: daysFromNow(10), subtotal: 6250000, discount: 0, gstRate: 18, gstAmount: 1125000, total: 7375000, amountPaid: 3000000, status: "partially_paid", terms: "Procurement milestone invoice.", isSample: true },
    { id: inv3, number: "INV-2026-090", type: "invoice", clientId: cCooper, projectId: pCooper, issueDate: daysFromNow(-15), dueDate: daysFromNow(-2), subtotal: 2800000, discount: 0, gstRate: 18, gstAmount: 504000, total: 3304000, amountPaid: 0, status: "overdue", terms: "Execution milestone 3.", isSample: true },
  ]);
  await db.insert(quotationItems).values([
    { id: createId(), quotationId: q1, description: "Interior design & 3D visualization — full home", quantity: 3400, unit: "sq ft", unitPrice: 450, amount: 1530000, sortOrder: 0 },
    { id: createId(), quotationId: q1, description: "Modular woodwork & joinery", quantity: 1, unit: "lot", unitPrice: 4200000, amount: 4200000, sortOrder: 1 },
    { id: createId(), quotationId: q1, description: "Flooring, tiling & marble", quantity: 1, unit: "lot", unitPrice: 2100000, amount: 2100000, sortOrder: 2 },
    { id: createId(), quotationId: q1, description: "Lighting, furniture & styling", quantity: 1, unit: "lot", unitPrice: 1970000, amount: 1970000, sortOrder: 3 },
    { id: createId(), quotationId: q2, description: "Scandinavian 2BHK design package", quantity: 1200, unit: "sq ft", unitPrice: 1200, amount: 1440000, sortOrder: 0 },
    { id: createId(), quotationId: q2, description: "Modular kitchen & wardrobes", quantity: 1, unit: "lot", unitPrice: 1060000, amount: 1060000, sortOrder: 1 },
  ]);

  /* ---------------------------- Documents ------------------------ */
  await db.insert(documents).values([
    { id: createId(), name: "Cooper Residence — Signed Agreement.pdf", category: "Client Agreement", projectId: pCooper, clientId: cCooper, fileUrl: "#", fileType: "pdf", fileSize: 842000, version: 2, uploadedById: adminId, isSample: true },
    { id: createId(), name: "Indiranagar — Master Suite Render v3.jpg", category: "3D Render", projectId: pIndira, clientId: cIndira, fileUrl: IMG.penthouse, fileType: "image", fileSize: 3200000, version: 3, uploadedById: des1, isSample: true },
    { id: createId(), name: "Whitefield — Ground Floor Plan.pdf", category: "Floor Plan", projectId: pWhitefield, clientId: cWhitefield, fileUrl: "#", fileType: "pdf", fileSize: 1250000, version: 1, uploadedById: des2, isSample: true },
    { id: createId(), name: "Cooper — Marble PO & Invoice.pdf", category: "Purchase Order", projectId: pCooper, clientId: cCooper, fileUrl: "#", fileType: "pdf", fileSize: 410000, version: 1, uploadedById: proc1, isSample: true },
    { id: createId(), name: "Cooper — Site Progress 12 Nov.jpg", category: "Site Photograph", projectId: pCooper, clientId: cCooper, fileUrl: IMG.villa, fileType: "image", fileSize: 2800000, version: 1, uploadedById: pm1, isSample: true },
  ]);

  /* ---------------------------- Activity ------------------------- */
  await db.insert(activities).values([
    { id: createId(), type: "payment", title: "Payment received — ₹30,00,000", description: "Indiranagar Penthouse procurement milestone (partial).", projectId: pIndira, actorId: fin1, isSample: true },
    { id: createId(), type: "approval", title: "Design approved — Cooper Living Room", description: "Daniel & Sarah Cooper approved the living room concept.", projectId: pCooper, actorId: des1, isSample: true },
    { id: createId(), type: "enquiry", title: "New enquiry — Sanjay Gupta", description: "Koramangala apartment, ₹32L budget, via Instagram.", projectId: null, actorId: des1, isSample: true },
    { id: createId(), type: "procurement", title: "Chandelier passed QC", description: "Cooper double-height chandelier cleared quality inspection.", projectId: pCooper, actorId: proc1, isSample: true },
    { id: createId(), type: "vendor", title: "Quotation received — Weave & Warp", description: "Sheer linen drapery for Whitefield residence.", projectId: pWhitefield, actorId: proc1, isSample: true },
    { id: createId(), type: "site_visit", title: "Site visit scheduled", description: "Marble installation QC at Cooper Residence.", projectId: pCooper, actorId: pm1, isSample: true },
  ]);

  /* ------------------------- Notifications ----------------------- */
  const minsAgo = (n: number) =>
    new Date(Date.now() - n * 60_000).toISOString();
  await db.insert(notifications).values([
    { id: createId(), userId: adminId, type: "lead", title: "New lead assigned: Sanjay Gupta", body: "Koramangala apartment, ₹32L budget, via Instagram.", href: "/leads", actorId: des1, isRead: false, createdAt: minsAgo(8), updatedAt: minsAgo(8), isSample: true },
    { id: createId(), userId: adminId, type: "approval", title: "Design approved — Cooper Living Room", body: "Daniel & Sarah Cooper approved the living room concept.", href: "/projects", actorId: des1, isRead: false, createdAt: minsAgo(55), updatedAt: minsAgo(55), isSample: true },
    { id: createId(), userId: adminId, type: "payment", title: "Payment received — ₹30,00,000", body: "Indiranagar Penthouse procurement milestone (partial).", href: "/finance", actorId: fin1, isRead: false, createdAt: minsAgo(180), updatedAt: minsAgo(180), isSample: true },
    { id: createId(), userId: adminId, type: "procurement", title: "Chandelier passed QC", body: "Cooper double-height chandelier cleared quality inspection.", href: "/procurement", actorId: proc1, isRead: true, readAt: minsAgo(600), createdAt: minsAgo(1440), updatedAt: minsAgo(1440), isSample: true },
    { id: createId(), userId: adminId, type: "task", title: "Site visit scheduled", body: "Marble installation QC at Cooper Residence.", href: "/tasks", actorId: pm1, isRead: true, readAt: minsAgo(700), createdAt: minsAgo(2880), updatedAt: minsAgo(2880), isSample: true },
  ]);

  console.log("✅ Seed complete.");
  console.log("   Login → designanddesirestudio@gmail.com / Welcome@123");
}

seed()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  });

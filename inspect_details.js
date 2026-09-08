import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBvXvVCvSqIMR_w_R12e48fqKQceCAa3m8",
  authDomain: "gargee-1d0ec.firebaseapp.com",
  projectId: "gargee-1d0ec",
  storageBucket: "gargee-1d0ec.firebasestorage.app",
  messagingSenderId: "306357708775",
  appId: "1:306357708775:web:cde14ae256c6ad976dbf42"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function inspectFullData() {
  const snap = await getDoc(doc(db, "store_catalog", "main_catalog"));
  if (!snap.exists()) {
    console.log("No main_catalog found");
    process.exit(0);
  }
  const data = snap.data();

  console.log("=== PRODUCTS ===");
  data.products.forEach((p, idx) => {
    const imgIsBase64 = typeof p.image === 'string' && p.image.startsWith('data:image');
    console.log(`[${idx+1}] ID: ${p.id} | Name: ${p.name} | Price: ${p.price} | InStock: ${p.inStock} | Base64Image: ${imgIsBase64}`);
  });

  console.log("\n=== ORDERS ===");
  data.orders.forEach((o, idx) => {
    console.log(`[${idx+1}] OrderID: ${o.orderId || o.id} | Customer: ${o.customer?.name || o.customerName} | Total: ${o.total || o.grandTotal} | Status: ${o.status}`);
  });

  console.log("\n=== CATEGORIES ===");
  console.log(data.categories);

  console.log("\n=== INQUIRIES ===");
  console.log(data.inquiries);

  console.log("\n=== SETTINGS & BUSINESS INFO ===");
  console.log("Settings:", data.settings);
  console.log("BusinessInfo:", data.businessInfo);

  process.exit(0);
}

inspectFullData();

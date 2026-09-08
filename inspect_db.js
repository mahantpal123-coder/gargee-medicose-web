import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, collection, getDocs } from "firebase/firestore";

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

async function checkCollections() {
  console.log("Checking Firestore collections...");

  const collectionsToCheck = ["products", "orders", "Orders", "customers", "settings", "taxCategories"];

  for (const colName of collectionsToCheck) {
    try {
      const snap = await getDocs(collection(db, colName));
      console.log(`Collection '${colName}': ${snap.size} documents`);
      if (snap.size > 0) {
        console.log(`  Sample doc from '${colName}':`, snap.docs[0].id, snap.docs[0].data());
      }
    } catch (err) {
      console.log(`Error reading collection '${colName}':`, err.message);
    }
  }

  // Also check main_catalog data
  try {
    const snap = await getDoc(doc(db, "store_catalog", "main_catalog"));
    if (snap.exists()) {
      const data = snap.data();
      console.log("\n--- main_catalog summary ---");
      console.log(`products count: ${data.products?.length || 0}`);
      console.log(`orders count: ${data.orders?.length || 0}`);
      console.log(`categories count: ${data.categories?.length || 0}`);
      console.log(`inquiries count: ${data.inquiries?.length || 0}`);
      console.log(`taxCategories count: ${data.taxCategories?.length || 0}`);
    }
  } catch (err) {
    console.error("Error reading main_catalog:", err.message);
  }

  process.exit(0);
}

checkCollections();

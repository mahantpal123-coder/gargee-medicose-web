import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";

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
const storage = getStorage(app);

const FALLBACK_PET_IMAGE = "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=500&q=80";

async function runMigration() {
  console.log("=== STARTING FIRESTORE MIGRATION ===");
  console.log("Reading store_catalog/main_catalog...");

  const snap = await getDoc(doc(db, "store_catalog", "main_catalog"));
  if (!snap.exists()) {
    console.error("CRITICAL ERROR: store_catalog/main_catalog does not exist!");
    process.exit(1);
  }

  const catalogData = snap.data();
  const rawProducts = Array.isArray(catalogData.products) ? catalogData.products : [];
  const rawOrders = Array.isArray(catalogData.orders) ? catalogData.orders : [];
  const rawCategories = Array.isArray(catalogData.categories) ? catalogData.categories : [];
  const rawInquiries = Array.isArray(catalogData.inquiries) ? catalogData.inquiries : [];
  const rawSettings = catalogData.settings || {};
  const rawBusinessInfo = catalogData.businessInfo || {};

  let productsMigrated = 0;
  let productsFailed = 0;
  let productsSkipped = 0;

  let base64ImagesMigrated = 0;

  console.log(`\nMigrating ${rawProducts.length} products to 'products/{productId}'...`);

  for (const prod of rawProducts) {
    if (!prod.id) {
      console.warn("Skipping product with missing ID:", prod);
      productsSkipped++;
      continue;
    }

    try {
      let finalImageUrl = prod.image || prod.imageUrl || FALLBACK_PET_IMAGE;

      // Handle Base64 images -> upload to Cloud Storage
      if (typeof finalImageUrl === "string" && finalImageUrl.startsWith("data:image")) {
        console.log(`Uploading base64 image to Cloud Storage for product: ${prod.id} (${prod.name})...`);
        try {
          const storagePath = `product-images/${prod.id}.png`;
          const imageRef = ref(storage, storagePath);
          await uploadString(imageRef, finalImageUrl, "data_url");
          finalImageUrl = await getDownloadURL(imageRef);
          base64ImagesMigrated++;
          console.log(`  Successfully uploaded image -> ${finalImageUrl}`);
        } catch (uploadErr) {
          console.warn(`  Storage upload note for ${prod.id}: ${uploadErr.message}. Using standard web URL fallback.`);
          finalImageUrl = FALLBACK_PET_IMAGE;
        }
      }

      // Also clean up gallery array if it contains base64
      let cleanGallery = Array.isArray(prod.gallery) ? prod.gallery : [];
      cleanGallery = cleanGallery.map((gUrl) => {
        if (typeof gUrl === "string" && gUrl.startsWith("data:image")) {
          return finalImageUrl;
        }
        return gUrl;
      });

      const productDoc = {
        id: prod.id,
        productId: prod.id,
        name: prod.name || "Untitled Product",
        price: Number(prod.price || 0),
        oldPrice: prod.oldPrice ? Number(prod.oldPrice) : null,
        stock: prod.stock !== undefined ? Number(prod.stock) : (prod.inStock !== false ? 10 : 0),
        inStock: prod.inStock !== false,
        active: prod.active !== false && prod.inStock !== false,
        category: prod.category || "General",
        brand: prod.brand || "General",
        productType: prod.productType || "",
        description: prod.description || "",
        image: finalImageUrl,
        imageUrl: finalImageUrl,
        gallery: cleanGallery.length > 0 ? cleanGallery : [finalImageUrl],
        variants: Array.isArray(prod.variants) ? prod.variants : [],
        isBestSeller: Boolean(prod.isBestSeller),
        isFeatured: Boolean(prod.isFeatured),
        rating: prod.rating ? Number(prod.rating) : 5.0,
        reviewsCount: prod.reviewsCount ? Number(prod.reviewsCount) : 1,
        sku: prod.sku || `SKU-${prod.id}`,
        hsnCode: prod.hsnCode || "2309",
        gstRate: prod.gstRate !== undefined ? Number(prod.gstRate) : 18,
        taxCategoryId: prod.taxCategoryId || "",
        createdAt: prod.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, "products", prod.id), productDoc);
      productsMigrated++;
      console.log(`  [OK] Migrated product: ${prod.id} - ${prod.name}`);
    } catch (err) {
      console.error(`  [FAILED] Product ${prod.id}:`, err.message);
      productsFailed++;
    }
  }

  console.log(`\nMigrating ${rawOrders.length} orders to 'orders/{orderId}'...`);

  let ordersMigrated = 0;
  let ordersFailed = 0;
  let ordersSkipped = 0;

  for (const ord of rawOrders) {
    const orderId = ord.orderId || ord.order_id || ord.id;
    if (!orderId) {
      console.warn("Skipping order with missing ID:", ord);
      ordersSkipped++;
      continue;
    }

    try {
      const rawItems = Array.isArray(ord.items)
        ? ord.items
        : Array.isArray(ord.cart)
        ? ord.cart
        : Array.isArray(ord.products)
        ? ord.products
        : [];

      const normalizedItems = rawItems.map((item, idx) => ({
        id: item.id || item.productId || `item-${idx}`,
        productId: item.id || item.productId || `item-${idx}`,
        name: item.name || item.product_name || "Product",
        price: Number(item.price || item.unit_price || 0),
        priceAtPurchase: Number(item.priceAtPurchase || item.price || item.unit_price || 0),
        quantity: Number(item.quantity || item.qty || 1),
        subtotal: Number(item.subtotal || (Number(item.price || 0) * Number(item.quantity || 1))),
        image: item.image || item.imageUrl || FALLBACK_PET_IMAGE,
        hsnCode: item.hsnCode || "2309",
        gstRate: item.gstRate !== undefined ? Number(item.gstRate) : 18
      }));

      const total = Number(ord.total || ord.grandTotal || ord.totalAmount || ord.amount || 0);
      const subtotal = Number(ord.subtotal || total);
      const delivery = Number(ord.delivery || ord.shipping_charge || 0);

      const orderDoc = {
        ...ord,
        orderId: orderId,
        id: orderId,
        customer: ord.customer || {
          name: ord.customerName || ord.name || "Customer",
          phone: ord.customerPhone || ord.phone || "",
          email: ord.customerEmail || ord.email || "",
          address: ord.address || "",
          city: ord.city || "Bilaspur",
          state: ord.state || "Chhattisgarh",
          pincode: ord.pincode || "495001"
        },
        items: normalizedItems,
        subtotal: subtotal,
        delivery: delivery,
        total: total,
        paymentMethod: ord.paymentMethod || "Online UPI",
        paymentStatus: ord.paymentStatus || "Paid",
        status: ord.status || "Pending Confirmation",
        createdAt: ord.createdAt || ord.date || new Date().toISOString(),
        date: ord.date || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, "orders", orderId), orderDoc);
      ordersMigrated++;
      console.log(`  [OK] Migrated order: ${orderId} (₹${total}) - ${orderDoc.customer.name}`);
    } catch (err) {
      console.error(`  [FAILED] Order ${orderId}:`, err.message);
      ordersFailed++;
    }
  }

  // Migrate Store Settings and Business Info to settings collection
  console.log("\nMigrating Store Settings & Business Info to 'settings/store_config'...");
  await setDoc(doc(db, "settings", "store_config"), {
    businessInfo: rawBusinessInfo,
    settings: rawSettings,
    categories: rawCategories,
    updatedAt: new Date().toISOString()
  });

  // Verify migrated document counts in Firestore
  console.log("\n=== VERIFYING MIGRATED DATA IN FIRESTORE ===");
  const prodSnap = await getDocs(collection(db, "products"));
  const ordSnap = await getDocs(collection(db, "orders"));

  console.log("\n=================================");
  console.log("      MIGRATION FINAL REPORT      ");
  console.log("=================================");
  console.log(`Existing products: ${rawProducts.length}`);
  console.log(`Successfully migrated: ${productsMigrated}`);
  console.log(`Failed: ${productsFailed}`);
  console.log(`Skipped: ${productsSkipped}`);
  console.log(`Base64 images processed: ${base64ImagesMigrated}`);
  console.log(`Verified Firestore products collection document count: ${prodSnap.size}`);
  console.log("---");
  console.log(`Existing orders: ${rawOrders.length}`);
  console.log(`Successfully migrated: ${ordersMigrated}`);
  console.log(`Failed: ${ordersFailed}`);
  console.log(`Skipped: ${ordersSkipped}`);
  console.log(`Verified Firestore orders collection document count: ${ordSnap.size}`);
  console.log("=================================\n");

  process.exit(0);
}

runMigration().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});

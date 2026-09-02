// Serverless In-Memory & Cloud Fallback Store for Gargee Medicose Catalog
let cachedCatalog = null;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      data: cachedCatalog,
      updatedAt: cachedCatalog?.updatedAt || null
    });
  }

  if (req.method === 'POST' || req.method === 'PUT') {
    const { products, categories, businessInfo, orders, inquiries } = req.body || {};
    cachedCatalog = {
      products: products || cachedCatalog?.products || [],
      categories: categories || cachedCatalog?.categories || [],
      businessInfo: businessInfo || cachedCatalog?.businessInfo || null,
      orders: orders || cachedCatalog?.orders || [],
      inquiries: inquiries || cachedCatalog?.inquiries || [],
      updatedAt: new Date().toISOString()
    };

    return res.status(200).json({
      success: true,
      message: 'Catalog updated successfully',
      data: cachedCatalog
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

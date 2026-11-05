import { db } from './db';
import { Dataset } from './types';
import { WorkflowOrchestrator } from './orchestrator';

export function seedSampleDatasets(ownerId: string) {
  const existing = db.listDatasets(ownerId);
  if (existing.length > 0) return; // already seeded or created

  // 1. E-Commerce Sales Dataset
  const ecommerceRows = [
    { order_id: "ORD-1001", order_date: "2026-01-05", customer_name: "Emma Watson ", region: "North America", segment: "Consumer", category: "Technology", product_name: "UltraBook Pro 15", sales: "$1,499.00", quantity: 2, discount: 0.10, profit: 340.50, return_status: "No" },
    { order_id: "ORD-1002", order_date: "2026-01-07", customer_name: "Liam Chen", region: "Europe", segment: "Corporate", category: "Furniture", product_name: "Ergonomic Desk Chair", sales: "$350.00", quantity: 4, discount: 0.05, profit: 85.00, return_status: "No" },
    { order_id: "ORD-1003", order_date: "2026-01-12", customer_name: "Sophia Rodriguez", region: "Asia Pacific", segment: "Consumer", category: "Office Supplies", product_name: "Laser Toner Pack", sales: "$89.50", quantity: 3, discount: 0.00, profit: 24.20, return_status: "No" },
    { order_id: "ORD-1004", order_date: "2026-01-15", customer_name: "James Wilson", region: "North America", segment: "Home Office", category: "Technology", product_name: "Noise-Cancelling Headphones", sales: "$299.99", quantity: 1, discount: 0.15, profit: 62.00, return_status: "No" },
    { order_id: "ORD-1005", order_date: "2026-01-20", customer_name: "Emma Watson ", region: "North America", segment: "Consumer", category: "Technology", product_name: "UltraBook Pro 15", sales: "$1,499.00", quantity: 2, discount: 0.10, profit: 340.50, return_status: "No" }, // Duplicate row
    { order_id: "ORD-1006", order_date: "2026-01-28", customer_name: "Lucas Garcia", region: "Europe", segment: "Corporate", category: "Furniture", product_name: "Executive Standing Desk", sales: "$850.00", quantity: 2, discount: 0.00, profit: 210.00, return_status: "Yes" },
    { order_id: "ORD-1007", order_date: "2026-02-02", customer_name: "Olivia Taylor", region: "North America", segment: "Consumer", category: "Office Supplies", product_name: "Heavy Duty Binder", sales: "$45.00", quantity: 5, discount: 0.20, profit: -8.50, return_status: "No" },
    { order_id: "ORD-1008", order_date: "2026-02-10", customer_name: "Noah Martinez", region: "Latin America", segment: "Home Office", category: "Technology", product_name: "Smart Monitor 27\"", sales: "$420.00", quantity: 1, discount: 0.00, profit: 115.00, return_status: "No" },
    { order_id: "ORD-1009", order_date: "2026-02-14", customer_name: "Ava Patel", region: "Asia Pacific", segment: "Corporate", category: "Technology", product_name: "Wireless Presentation Remote", sales: "$65.00", quantity: null, discount: 0.05, profit: 18.00, return_status: "No" },
    { order_id: "ORD-1010", order_date: "2026-02-21", customer_name: "William Brown", region: "North America", segment: "Consumer", category: "Furniture", product_name: "Bookshelf 5-Tier", sales: "$180.00", quantity: 2, discount: 0.10, profit: 32.00, return_status: "No" },
    { order_id: "ORD-1011", order_date: "2026-02-27", customer_name: "Isabella Davis", region: "Europe", segment: "Home Office", category: "Office Supplies", product_name: "Gel Pen Box 24x", sales: "$28.00", quantity: 8, discount: 0.00, profit: 11.20, return_status: "No" },
    { order_id: "ORD-1012", order_date: "2026-03-04", customer_name: "Mason Miller", region: "North America", segment: "Corporate", category: "Technology", product_name: "Server Rack UPS Battery", sales: "$3,200.00", quantity: 1, discount: 0.00, profit: 890.00, return_status: "No" }, // Outlier
    { order_id: "ORD-1013", order_date: "2026-03-09", customer_name: "Mia Anderson", region: "Asia Pacific", segment: "Consumer", category: "Furniture", product_name: "Leather Swivel Chair", sales: "$240.00", quantity: 2, discount: 0.15, profit: 45.00, return_status: "No" },
    { order_id: "ORD-1014", order_date: "2026-03-15", customer_name: "Alexander White", region: "Europe", segment: "Corporate", category: "Office Supplies", product_name: "Paper Shredder Pro", sales: "$150.00", quantity: 1, discount: 0.00, profit: 38.00, return_status: "No" },
    { order_id: "ORD-1015", order_date: "2026-03-22", customer_name: "Charlotte Harris", region: "North America", segment: "Consumer", category: "Technology", product_name: "USB-C Multiport Dock", sales: "$95.00", quantity: 3, discount: 0.05, profit: 26.50, return_status: "No" },
    { order_id: "ORD-1016", order_date: "2026-03-28", customer_name: "Ethan Clark", region: "North America", segment: "Home Office", category: "Furniture", product_name: "Mobile Filing Cabinet", sales: "$195.00", quantity: 2, discount: 0.00, profit: 54.00, return_status: "No" },
    { order_id: "ORD-1017", order_date: "2026-04-03", customer_name: "Amelia Lewis", region: "Europe", segment: "Consumer", category: "Office Supplies", product_name: "Copy Paper Case 10 Reams", sales: "$60.00", quantity: 6, discount: 0.10, profit: 12.00, return_status: "No" },
    { order_id: "ORD-1018", order_date: "2026-04-10", customer_name: "Benjamin Hall", region: "Latin America", segment: "Corporate", category: "Technology", product_name: "Mechanical Keyboard", sales: "$140.00", quantity: 2, discount: 0.00, profit: 42.00, return_status: "No" },
    { order_id: "ORD-1019", order_date: "2026-04-16", customer_name: "Harper Allen", region: "Asia Pacific", segment: "Consumer", category: "Furniture", product_name: "LED Desk Lamp", sales: "$45.00", quantity: 3, discount: 0.00, profit: 16.50, return_status: "No" },
    { order_id: "ORD-1020", order_date: "2026-04-24", customer_name: "Daniel Young", region: "North America", segment: "Home Office", category: "Technology", product_name: "Thunderbolt SSD 2TB", sales: "$280.00", quantity: 2, discount: 0.10, profit: 78.00, return_status: "No" }
  ];

  const dataset1: Dataset = {
    id: 'ds_ecommerce_demo',
    ownerId,
    name: 'Global E-Commerce Sales & Margins',
    description: 'Multi-regional order volume, gross revenue, category profit margins, and return tracking with retail metrics.',
    originalFileName: 'ecommerce_sales_2026.csv',
    fileFormat: 'csv',
    fileSize: 4280,
    rowCount: ecommerceRows.length,
    columnCount: Object.keys(ecommerceRows[0]).length,
    currentVersion: 1,
    processingStatus: 'uploaded',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const csvContent = Object.keys(ecommerceRows[0]).join(',') + '\n' +
    ecommerceRows.map(r => Object.values(r).map(v => typeof v === 'string' && v.includes(',') ? `"${v}"` : v).join(',')).join('\n');

  db.createDataset(dataset1, csvContent, ecommerceRows);

  // Run the full pipeline for dataset 1 so the user lands with an active, cleaned, interactive dashboard right away!
  WorkflowOrchestrator.runFullWorkflow(dataset1.id, ownerId).catch(err => {
    console.error('Failed to pre-process demo dataset:', err);
  });
}

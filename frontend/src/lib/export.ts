import Papa from 'papaparse';
import type { Bid, Blueprint } from '../types/api';

/**
 * Export estimates/bids to CSV
 */
export function exportEstimatesToCSV(bids: Bid[], filename = 'estimates.csv') {
  const data = bids.map((bid) => ({
    ID: bid.id,
    'Project Name': bid.project_name,
    'Customer Name': bid.customer_name || '',
    Status: bid.status,
    'Grand Total': bid.grand_total,
    'Labor Cost': bid.labor_cost,
    'Material Cost': bid.material_cost,
    'Markup %': bid.markup_percentage,
    'Created At': new Date(bid.created_at).toLocaleDateString(),
    'Updated At': new Date(bid.updated_at).toLocaleDateString(),
  }));

  const csv = Papa.unparse(data);
  downloadCSV(csv, filename);
}

/**
 * Export blueprints to CSV
 */
export function exportBlueprintsToCSV(blueprints: Blueprint[], filename = 'blueprints.csv') {
  const data = blueprints.map((bp) => ({
    ID: bp.id,
    'Project Name': bp.project_name || '',
    'File Name': bp.file_name,
    Status: bp.status,
    'Total Fixtures': bp.total_fixtures,
    'Total Bathrooms': bp.total_bathrooms || 0,
    'Total Kitchens': bp.total_kitchens || 0,
    'Created At': new Date(bp.created_at).toLocaleDateString(),
    'Updated At': new Date(bp.updated_at).toLocaleDateString(),
  }));

  const csv = Papa.unparse(data);
  downloadCSV(csv, filename);
}

/**
 * Generic CSV export function
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string
) {
  const csv = Papa.unparse(data);
  downloadCSV(csv, filename);
}

/**
 * Download CSV file
 */
function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

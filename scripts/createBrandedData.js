const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// BRANDED parts data extracted from the uploaded image
const brandedData = [
    { "Supplier": "RBO0101", "Product Code": "LR037089", "Full Description": "F TYPE - IN", "Free Stock": 3546, "Trade Price": 12.94, "Band 1": 12.43, "Band 2": 12.3, "Band 3": 12.17, "Band 4": 12.04, "Minimum Price": 10.98 },
    { "Supplier": "GTO0101", "Product Code": "11000-803", "Full Description": "RONDELLE", "Free Stock": 2800, "Trade Price": 0.28, "Band 1": 0.27, "Band 2": 0.26, "Band 3": 0.25, "Band 4": 0.25, "Minimum Price": 0.25 },
    { "Supplier": "COR0101", "Product Code": "LR010753", "Full Description": "XF - VALVE", "Free Stock": 2684, "Trade Price": 0.44, "Band 1": 0.41, "Band 2": 0.41, "Band 3": 0.41, "Band 4": 0.4, "Minimum Price": 0.32 },
    { "Supplier": "GTO0101", "Product Code": "15B00-802", "Full Description": "ECROU SP", "Free Stock": 2100, "Trade Price": 0.51, "Band 1": 0.5, "Band 2": 0.48, "Band 3": 0.47, "Band 4": 0.47, "Minimum Price": 0.45 },
    { "Supplier": "ARG0101", "Product Code": "XNB10007", "Full Description": "SENDER-F", "Free Stock": 2078, "Trade Price": 24.68, "Band 1": 23.94, "Band 2": 23.94, "Band 3": 23.69, "Band 4": 23.44, "Minimum Price": 21.58 },
    { "Supplier": "MAH0101", "Product Code": "ERR3340M", "Full Description": "FILTER - M", "Free Stock": 1543, "Trade Price": 2.95, "Band 1": 2.86, "Band 2": 2.86, "Band 3": 2.84, "Band 4": 2.81, "Minimum Price": 2.64 },
    { "Supplier": "GTO0101", "Product Code": "71A00-803", "Full Description": "RONDELLE", "Free Stock": 1300, "Trade Price": 0.4, "Band 1": 0.38, "Band 2": 0.37, "Band 3": 0.36, "Band 4": 0.36, "Minimum Price": 0.35 },
    { "Supplier": "GTO0101", "Product Code": "14C01-800", "Full Description": "VIS", "Free Stock": 1200, "Trade Price": 1.43, "Band 1": 1.38, "Band 2": 1.34, "Band 3": 1.3, "Band 4": 1.3, "Minimum Price": 1.26 },
    { "Supplier": "GTO0101", "Product Code": "72A12-813", "Full Description": "SCREW", "Free Stock": 1138, "Trade Price": 0.07, "Band 1": 0.07, "Band 2": 0.07, "Band 3": 0.07, "Band 4": 0.07, "Minimum Price": 0.06 },
    { "Supplier": "GTO0101", "Product Code": "71A79-362", "Full Description": "RUBBER SI", "Free Stock": 1074, "Trade Price": 0.45, "Band 1": 0.43, "Band 2": 0.42, "Band 3": 0.41, "Band 4": 0.41, "Minimum Price": 0.4 },
    { "Supplier": "GTO0101", "Product Code": "14C01-903", "Full Description": "WASHER", "Free Stock": 1000, "Trade Price": 0.08, "Band 1": 0.08, "Band 2": 0.08, "Band 3": 0.08, "Band 4": 0.08, "Minimum Price": 0.08 },
    { "Supplier": "MAH0101", "Product Code": "1311285G", "Full Description": "S TYPE XJ", "Free Stock": 862, "Trade Price": 0.66, "Band 1": 0.64, "Band 2": 0.64, "Band 3": 0.64, "Band 4": 0.63, "Minimum Price": 0.58 },
    { "Supplier": "MAH0101", "Product Code": "PHE00011", "Full Description": "AIR FILTER", "Free Stock": 847, "Trade Price": 6.85, "Band 1": 6.65, "Band 2": 6.65, "Band 3": 6.58, "Band 4": 6.51, "Minimum Price": 6.08 },
    { "Supplier": "COR0101", "Product Code": "FTC4785G", "Full Description": "OIL SEAL -", "Free Stock": 813, "Trade Price": 3.16, "Band 1": 3.16, "Band 2": 3.16, "Band 3": 3.16, "Band 4": 3.16, "Minimum Price": 3.16 },
    { "Supplier": "MAH0101", "Product Code": "LPX10059", "Full Description": "OIL FILTER", "Free Stock": 764, "Trade Price": 3.25, "Band 1": 3.16, "Band 2": 3.16, "Band 3": 3.12, "Band 4": 3.09, "Minimum Price": 2.86 },
    { "Supplier": "BWC0101", "Product Code": "RNB50158", "Full Description": "DAMPER D", "Free Stock": 728, "Trade Price": 149.94, "Band 1": 145.44, "Band 2": 145.44, "Band 3": 143.94, "Band 4": 142.44, "Minimum Price": 142.44 },
    { "Supplier": "GTO0101", "Product Code": "11003-800", "Full Description": "VIS", "Free Stock": 700, "Trade Price": 0.07, "Band 1": 0.07, "Band 2": 0.07, "Band 3": 0.07, "Band 4": 0.07, "Minimum Price": 0.06 },
    { "Supplier": "GTO0101", "Product Code": "71A00-800", "Full Description": "SCREW", "Free Stock": 700, "Trade Price": 0.04, "Band 1": 0.04, "Band 2": 0.04, "Band 3": 0.04, "Band 4": 0.04, "Minimum Price": 0.04 },
    { "Supplier": "TIM0101", "Product Code": "RTC3429G", "Full Description": "HUB BEAR", "Free Stock": 694, "Trade Price": 8.14, "Band 1": 7.9, "Band 2": 7.9, "Band 3": 7.82, "Band 4": 7.73, "Minimum Price": 7.01 },
    { "Supplier": "MHU0101", "Product Code": "LR011593", "Full Description": "AIR FILTER", "Free Stock": 605, "Trade Price": 12.07, "Band 1": 11.7, "Band 2": 11.7, "Band 3": 11.58, "Band 4": 11.46, "Minimum Price": 10.47 },
    { "Supplier": "OSV0101", "Product Code": "8W936505", "Full Description": "XK XF XJ -", "Free Stock": 601, "Trade Price": 5.42, "Band 1": 5.25, "Band 2": 5.25, "Band 3": 5.2, "Band 4": 5.15, "Minimum Price": 4.81 },
    { "Supplier": "GTO0101", "Product Code": "71A00-803", "Full Description": "RONDELLE", "Free Stock": 600, "Trade Price": 0.27, "Band 1": 0.26, "Band 2": 0.25, "Band 3": 0.24, "Band 4": 0.24, "Minimum Price": 0.24 },
    { "Supplier": "GKN0101", "Product Code": "TVB50036", "Full Description": "DRIVE SHA", "Free Stock": 593, "Trade Price": 325.78, "Band 1": 316, "Band 2": 316, "Band 3": 312.75, "Band 4": 309.49, "Minimum Price": 292.01 },
    { "Supplier": "MAH0101", "Product Code": "HCOPL68", "Full Description": "OIL A/C CO", "Free Stock": 569, "Trade Price": 5.6, "Band 1": 5.38, "Band 2": 5.32, "Band 3": 5.26, "Band 4": 5.21, "Minimum Price": 4.57 },
    { "Supplier": "MAH0101", "Product Code": "LR027408", "Full Description": "AIR FILTER", "Free Stock": 525, "Trade Price": 5.95, "Band 1": 5.77, "Band 2": 5.77, "Band 3": 5.71, "Band 4": 5.65, "Minimum Price": 5.21 },
    { "Supplier": "ELT0101", "Product Code": "JLB505", "Full Description": "BULB - LUC", "Free Stock": 500, "Trade Price": 0.19, "Band 1": 0.19, "Band 2": 0.18, "Band 3": 0.18, "Band 4": 0.18, "Minimum Price": 0.16 },
    { "Supplier": "AEA0101", "Product Code": "LR123892", "Full Description": "SPARK PLU", "Free Stock": 500, "Trade Price": 3.89, "Band 1": 3.74, "Band 2": 3.7, "Band 3": 3.66, "Band 4": 3.62, "Minimum Price": 3.34 },
    { "Supplier": "TTD0101", "Product Code": "KTB694", "Full Description": "TIMING BE", "Free Stock": 497, "Trade Price": 50.34, "Band 1": 48.83, "Band 2": 48.83, "Band 3": 48.32, "Band 4": 47.82, "Minimum Price": 43.82 },
    { "Supplier": "GKN0101", "Product Code": "RTC3346G", "Full Description": "UNIVERSA", "Free Stock": 496, "Trade Price": 8.72, "Band 1": 8.46, "Band 2": 8.46, "Band 3": 8.37, "Band 4": 8.28, "Minimum Price": 7.79 },
    { "Supplier": "MAH0101", "Product Code": "LR029078", "Full Description": "AIR FILTER", "Free Stock": 492, "Trade Price": 11.77, "Band 1": 11.42, "Band 2": 11.42, "Band 3": 11.3, "Band 4": 11.18, "Minimum Price": 10.45 }
];

// Create samples directory if it doesn't exist
const samplesDir = path.join(__dirname, '..', 'samples');
if (!fs.existsSync(samplesDir)) {
    fs.mkdirSync(samplesDir, { recursive: true });
}

// Create workbook
const workbook = XLSX.utils.book_new();

// Convert data to worksheet
const worksheet = XLSX.utils.json_to_sheet(brandedData);

// Set column widths
const columnWidths = [
    { wch: 12 }, // Supplier
    { wch: 15 }, // Product Code
    { wch: 35 }, // Full Description
    { wch: 12 }, // Free Stock
    { wch: 12 }, // Trade Price
    { wch: 12 }, // Band 1
    { wch: 12 }, // Band 2
    { wch: 12 }, // Band 3
    { wch: 12 }, // Band 4
    { wch: 15 }  // Minimum Price
];
worksheet['!cols'] = columnWidths;

// Add worksheet to workbook
XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');

// Write to file
const filePath = path.join(samplesDir, 'Branded_parts.xlsx');
XLSX.writeFile(workbook, filePath);

console.log(`✅ Created: ${filePath}`);
console.log(`   Rows: ${brandedData.length}`);
console.log('\n💡 Note: This file uses "BRANDED" part type');
console.log('   The import script currently only supports GENUINE and AFTERMARKET types.');
console.log('   You may need to add BRANDED support to the import worker.');

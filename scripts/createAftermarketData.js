const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// AFTERMARKET parts data extracted from the uploaded image
const aftermarketData = [
    { "Supplier": "JOL0101", "Product Code": "BYG10014", "Full Description": "BOLT - EUR", "Free Stock": 3815, "Trade Price": 0.17, "Band 1": 0.16, "Band 2": 0.16, "Band 3": 0.15, "Band 4": 0.15, "Minimum Price": 0.1 },
    { "Supplier": "JOL0101", "Product Code": "217353X", "Full Description": "WASHER -", "Free Stock": 3293, "Trade Price": 0.14, "Band 1": 0.14, "Band 2": 0.14, "Band 3": 0.13, "Band 4": 0.13, "Minimum Price": 0.11 },
    { "Supplier": "JOL0101", "Product Code": "NTC7867E", "Full Description": "CLIP - EUR", "Free Stock": 3100, "Trade Price": 0.16, "Band 1": 0.15, "Band 2": 0.15, "Band 3": 0.15, "Band 4": 0.15, "Minimum Price": 0.12 },
    { "Supplier": "OSB0101", "Product Code": "ERR2943G", "Full Description": "BOLT CYL", "Free Stock": 2881, "Trade Price": 0.41, "Band 1": 0.39, "Band 2": 0.39, "Band 3": 0.38, "Band 4": 0.38, "Minimum Price": 0.34 },
    { "Supplier": "JOL0101", "Product Code": "LR030593", "Full Description": "XK XJ - ENG", "Free Stock": 2786, "Trade Price": 0.57, "Band 1": 0.53, "Band 2": 0.52, "Band 3": 0.51, "Band 4": 0.5, "Minimum Price": 0.24 },
    { "Supplier": "JET0101", "Product Code": "CRC1250L", "Full Description": "CLIP - EUR", "Free Stock": 2747, "Trade Price": 0.18, "Band 1": 0.17, "Band 2": 0.17, "Band 3": 0.16, "Band 4": 0.16, "Minimum Price": 0.08 },
    { "Supplier": "JOL0101", "Product Code": "RDI00003", "Full Description": "BOLT - LOV", "Free Stock": 2704, "Trade Price": 2.3, "Band 1": 2.21, "Band 2": 2.19, "Band 3": 2.16, "Band 4": 2.14, "Minimum Price": 1.8 },
    { "Supplier": "JOL0101", "Product Code": "FTC4785R", "Full Description": "SEAL", "Free Stock": 2605, "Trade Price": 0.48, "Band 1": 0.47, "Band 2": 0.47, "Band 3": 0.46, "Band 4": 0.46, "Minimum Price": 0.43 },
    { "Supplier": "OSB0101", "Product Code": "BX110095", "Full Description": "DRIVE FLA", "Free Stock": 2514, "Trade Price": 0.34, "Band 1": 0.32, "Band 2": 0.32, "Band 3": 0.32, "Band 4": 0.31, "Minimum Price": 0.29 },
    { "Supplier": "SLA0101", "Product Code": "PRC3180E", "Full Description": "CLIP - EUR", "Free Stock": 2478, "Trade Price": 0.42, "Band 1": 0.39, "Band 2": 0.39, "Band 3": 0.38, "Band 4": 0.37, "Minimum Price": 0.15 },
    { "Supplier": "MIL0101", "Product Code": "SKE50006", "Full Description": "PEDAL PAC", "Free Stock": 2477, "Trade Price": 0.4, "Band 1": 0.39, "Band 2": 0.39, "Band 3": 0.38, "Band 4": 0.38, "Minimum Price": 0.34 },
    { "Supplier": "HNA0101", "Product Code": "8W938A52", "Full Description": "WATER OU", "Free Stock": 2441, "Trade Price": 19.15, "Band 1": 18.38, "Band 2": 18.19, "Band 3": 18, "Band 4": 17.81, "Minimum Price": 14.96 },
    { "Supplier": "SLA0101", "Product Code": "LR005901", "Full Description": "X TYPE - VA", "Free Stock": 2410, "Trade Price": 0.27, "Band 1": 0.26, "Band 2": 0.26, "Band 3": 0.25, "Band 4": 0.25, "Minimum Price": 0.24 },
    { "Supplier": "JOL0101", "Product Code": "602152ES", "Full Description": "PLUG - EUI", "Free Stock": 2387, "Trade Price": 0.25, "Band 1": 0.23, "Band 2": 0.23, "Band 3": 0.23, "Band 4": 0.22, "Minimum Price": 0.14 },
    { "Supplier": "CCL0101", "Product Code": "YWB5000C", "Full Description": "RELAY - EL", "Free Stock": 2295, "Trade Price": 1, "Band 1": 0.96, "Band 2": 0.95, "Band 3": 0.94, "Band 4": 0.93, "Minimum Price": 0.8 },
    { "Supplier": "JAL0101", "Product Code": "LR006295", "Full Description": "WASHER -", "Free Stock": 2210, "Trade Price": 0.19, "Band 1": 0.18, "Band 2": 0.17, "Band 3": 0.17, "Band 4": 0.17, "Minimum Price": 0.12 },
    { "Supplier": "JOL0101", "Product Code": "BH110091", "Full Description": "BOLT - EUR", "Free Stock": 2165, "Trade Price": 0.18, "Band 1": 0.18, "Band 2": 0.17, "Band 3": 0.17, "Band 4": 0.17, "Minimum Price": 0.16 },
    { "Supplier": "SLA0101", "Product Code": "LR013135", "Full Description": "CLIP - TRIM", "Free Stock": 2124, "Trade Price": 0.15, "Band 1": 0.14, "Band 2": 0.13, "Band 3": 0.13, "Band 4": 0.12, "Minimum Price": 0.06 },
    { "Supplier": "JAL0101", "Product Code": "NCE2528A", "Full Description": "VALVE STE", "Free Stock": 1978, "Trade Price": 0.43, "Band 1": 0.4, "Band 2": 0.4, "Band 3": 0.39, "Band 4": 0.38, "Minimum Price": 0.24 },
    { "Supplier": "JAL0101", "Product Code": "LR004304", "Full Description": "DRAIN PLU", "Free Stock": 1975, "Trade Price": 0.77, "Band 1": 0.69, "Band 2": 0.67, "Band 3": 0.65, "Band 4": 0.61, "Minimum Price": 0.12 },
    { "Supplier": "HND0101", "Product Code": "FW104EX", "Full Description": "XJ6 XJ12 -", "Free Stock": 1952, "Trade Price": 0.1, "Band 1": 0.1, "Band 2": 0.1, "Band 3": 0.1, "Band 4": 0.09, "Minimum Price": 0.08 },
    { "Supplier": "JOL0101", "Product Code": "SX110256", "Full Description": "SCREW - E", "Free Stock": 1914, "Trade Price": 0.15, "Band 1": 0.14, "Band 2": 0.14, "Band 3": 0.14, "Band 4": 0.13, "Minimum Price": 0.08 },
    { "Supplier": "JAL0101", "Product Code": "ERR1782E", "Full Description": "VALVE STE", "Free Stock": 1900, "Trade Price": 0.27, "Band 1": 0.25, "Band 2": 0.25, "Band 3": 0.24, "Band 4": 0.24, "Minimum Price": 0.15 },
    { "Supplier": "JOL0101", "Product Code": "MWC3136", "Full Description": "FASTENER", "Free Stock": 1820, "Trade Price": 0.5, "Band 1": 0.45, "Band 2": 0.44, "Band 3": 0.42, "Band 4": 0.4, "Minimum Price": 0.04 },
    { "Supplier": "HND0101", "Product Code": "LR004370", "Full Description": "X TYPE - CY", "Free Stock": 1800, "Trade Price": 0.94, "Band 1": 0.94, "Band 2": 0.94, "Band 3": 0.94, "Band 4": 0.94, "Minimum Price": 0.94 },
    { "Supplier": "JAL0101", "Product Code": "LR068126", "Full Description": "WHEEL NU", "Free Stock": 1705, "Trade Price": 1.15, "Band 1": 1.08, "Band 2": 1.07, "Band 3": 1.05, "Band 4": 1.03, "Minimum Price": 0.79 },
    { "Supplier": "SLA0101", "Product Code": "LR006678", "Full Description": "SEAL INL. I", "Free Stock": 1663, "Trade Price": 2.65, "Band 1": 2.39, "Band 2": 2.33, "Band 3": 2.25, "Band 4": 2.12, "Minimum Price": 0.98 },
    { "Supplier": "JET0101", "Product Code": "MWC9134", "Full Description": "TRIM FAST", "Free Stock": 1655, "Trade Price": 0.13, "Band 1": 0.13, "Band 2": 0.13, "Band 3": 0.12, "Band 4": 0.12, "Minimum Price": 0.11 },
    { "Supplier": "JET0101", "Product Code": "EYC10671", "Full Description": "CLIP - EUR", "Free Stock": 1605, "Trade Price": 0.13, "Band 1": 0.12, "Band 2": 0.12, "Band 3": 0.12, "Band 4": 0.11, "Minimum Price": 0.06 },
    { "Supplier": "SLA0101", "Product Code": "RYF00020", "Full Description": "WASHER V", "Free Stock": 1568, "Trade Price": 0.85, "Band 1": 0.79, "Band 2": 0.78, "Band 3": 0.77, "Band 4": 0.75, "Minimum Price": 0.43 }
];

// Create samples directory if it doesn't exist
const samplesDir = path.join(__dirname, '..', 'samples');
if (!fs.existsSync(samplesDir)) {
    fs.mkdirSync(samplesDir, { recursive: true });
}

// Create workbook
const workbook = XLSX.utils.book_new();

// Convert data to worksheet
const worksheet = XLSX.utils.json_to_sheet(aftermarketData);

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
const filePath = path.join(samplesDir, 'Aftermarket_parts_real.xlsx');
XLSX.writeFile(workbook, filePath);

console.log(`✅ Created: ${filePath}`);
console.log(`   Rows: ${aftermarketData.length}`);
console.log('\n💡 You can now test the import with:');
console.log('   pnpm --filter worker run import:aftermarket');

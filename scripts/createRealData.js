const XLSX = require('xlsx');
const path = require('path');

// Data extracted from the uploaded image
const productData = [
    { "Supplier": "JAM0101", "Product Code": "C2C31969", "Full Description": "GLASS-WINDSCREEN", "Free Stock": 0, "Trade Price": 45261.81, "Band 1": 41106.41, "Band 2": 41147.1, "Band 3": 41187.8, "Band 4": 41228.49, "Minimum Price": 36358.1 },
    { "Supplier": "JAM0101", "Product Code": "C2C31968", "Full Description": "GLASS-BACKLIGHT", "Free Stock": 0, "Trade Price": 42715.8, "Band 1": 38681.71, "Band 2": 38832.55, "Band 3": 38813.15, "Band 4": 38767.23, "Minimum Price": 37144.17 },
    { "Supplier": "JAG0101", "Product Code": "", "Full Description": "431124568 Lithium-Ion Battery", "Free Stock": 0, "Trade Price": 30252.35, "Band 1": 28251.83, "Band 2": 27511.75, "Band 3": 27356.32, "Band 4": 27211.24, "Minimum Price": 26315.59 },
    { "Supplier": "JAM0101", "Product Code": "T2H22092", "Full Description": "BODYSHELL", "Free Stock": 0, "Trade Price": 27834.05, "Band 1": 25058.62, "Band 2": 25303.08, "Band 3": 25100.72, "Band 4": 24935.32, "Minimum Price": 24203.52 },
    { "Supplier": "JAM0101", "Product Code": "T2R26677", "Full Description": "BODYSHELL", "Free Stock": 0, "Trade Price": 26614.05, "Band 1": 25080.02, "Band 2": 25083.66, "Band 3": 25086.72, "Band 4": 24965.32, "Minimum Price": 24203.52 },
    { "Supplier": "JAM0101", "Product Code": "C2C47118", "Full Description": "Bodyshell", "Free Stock": 0, "Trade Price": 25986.43, "Band 1": 24748.98, "Band 2": 23624.02, "Band 3": 23496.55, "Band 4": 24280.11, "Minimum Price": 22586.80 },
    { "Supplier": "JAM0101", "Product Code": "T2H48630", "Full Description": "Bodyshell", "Free Stock": 0, "Trade Price": 25988.43, "Band 1": 24748.98, "Band 2": 23624.02, "Band 3": 23496.55, "Band 4": 22269.11, "Minimum Price": 22586.80 },
    { "Supplier": "JAM0101", "Product Code": "C2D21814", "Full Description": "GLASS WINDSCREEN", "Free Stock": 0, "Trade Price": 24806.4, "Band 1": 23625.14, "Band 2": 23551.27, "Band 3": 22423.86, "Band 4": 22222.98, "Minimum Price": 21570.78 },
    { "Supplier": "LR40101", "Product Code": "LR136413", "Full Description": "ENGINE - STRIPPED", "Free Stock": 0, "Trade Price": 22768.76, "Band 1": 22308.83, "Band 2": 21753.82, "Band 3": 21611.03, "Band 4": 21417.42, "Minimum Price": 20798.87 },
    { "Supplier": "JAM0101", "Product Code": "C2C30658", "Full Description": "TANK-FUEL", "Free Stock": 0, "Trade Price": 22756.50, "Band 1": 18782.08, "Band 2": 20867.75, "Band 3": 20578.87, "Band 4": 20365.58, "Minimum Price": 19788.28 },
    { "Supplier": "LR40101", "Product Code": "LR163986", "Full Description": "ENGINE - STRIPPED", "Free Stock": 0, "Trade Price": 21305.91, "Band 1": 21854.84, "Band 2": 20038.8, "Band 3": 20027.9, "Band 4": 20048.74, "Minimum Price": 19457.59 },
    { "Supplier": "LR40101", "Product Code": "LR034550", "Full Description": "KIT - SLIDING FLOOR", "Free Stock": 0, "Trade Price": 20623.36, "Band 1": 20380.73, "Band 2": 19685.93, "Band 3": 19574.71, "Band 4": 19599.35, "Minimum Price": 18530.02 },
    { "Supplier": "JAM0101", "Product Code": "C2C33905", "Full Description": "KIT-FRESH AIR", "Free Stock": 0, "Trade Price": 20588.53, "Band 1": 19517.87, "Band 2": 18725.93, "Band 3": 18626.17, "Band 4": 18453.33, "Minimum Price": 17911.76 },
    { "Supplier": "LR40101", "Product Code": "", "Full Description": "411124909 Lithium-Ion Battery", "Free Stock": 0, "Trade Price": 20305.08, "Band 1": 20264.64, "Band 2": 18576.8, "Band 3": 19462.21, "Band 4": 19248.65, "Minimum Price": 18722.76 },
    { "Supplier": "JAM0101", "Product Code": "T2K13998", "Full Description": "BODYSHELL", "Free Stock": 0, "Trade Price": 20301.4, "Band 1": 19334.67, "Band 2": 18485.82, "Band 3": 18351.86, "Band 4": 18187.14, "Minimum Price": 17653.30 },
    { "Supplier": "JAG0101", "Product Code": "T2K13995", "Full Description": "BODYSHELL", "Free Stock": 0, "Trade Price": 20301.4, "Band 1": 19334.67, "Band 2": 18485.82, "Band 3": 18351.55, "Band 4": 18187.14, "Minimum Price": 17653.30 },
    { "Supplier": "JAM0101", "Product Code": "T2K14000", "Full Description": "BODYSHELL", "Free Stock": 0, "Trade Price": 20301.4, "Band 1": 19334.67, "Band 2": 18485.82, "Band 3": 18351.55, "Band 4": 18187.14, "Minimum Price": 17653.30 },
    { "Supplier": "JAM0101", "Product Code": "T2K14001", "Full Description": "Bodyshell", "Free Stock": 0, "Trade Price": 20301.4, "Band 1": 19334.67, "Band 2": 18485.82, "Band 3": 18351.30, "Band 4": 18187.14, "Minimum Price": 17653.30 },
    { "Supplier": "JAM0101", "Product Code": "T2K4799", "Full Description": "BODYSHELL", "Free Stock": 0, "Trade Price": 20301.4, "Band 1": 19334.67, "Band 2": 18485.82, "Band 3": 18351.55, "Band 4": 18187.14, "Minimum Price": 17653.30 },
    { "Supplier": "JAM0101", "Product Code": "T2R36986", "Full Description": "ENGINE-STRIPPED", "Free Stock": 0, "Trade Price": 19576.1, "Band 1": 18844.01, "Band 2": 17796.56, "Band 3": 17686.01, "Band 4": 17537.45, "Minimum Price": 17022.79 },
    { "Supplier": "LR40101", "Product Code": "LR071017", "Full Description": "SERVICE ENGINE", "Free Stock": 0, "Trade Price": 18520.24, "Band 1": 18290.59, "Band 2": 18632.95, "Band 3": 18227.68, "Band 4": 18361.7, "Minimum Price": 17822.83 },
    { "Supplier": "JAM0101", "Product Code": "C2U18713", "Full Description": "ENGINE STRIPPED", "Free Stock": 0, "Trade Price": 18028.26, "Band 1": 18122.17, "Band 2": 17298.43, "Band 3": 17200.7, "Band 4": 17040.61, "Minimum Price": 16506.30 },
    { "Supplier": "JAM0101", "Product Code": "C2D19886", "Full Description": "ENGINE-COMPLETE", "Free Stock": 0, "Trade Price": 18087.20, "Band 1": 17435.45, "Band 2": 16642.95, "Band 3": 16548.9, "Band 4": 16400.65, "Minimum Price": 15919.30 },
    { "Supplier": "LR40101", "Product Code": "LR070701", "Full Description": "KIT - STOWAGE BOX", "Free Stock": 0, "Trade Price": 18057.95, "Band 1": 17446.51, "Band 2": 17297.14, "Band 3": 17139.75, "Band 4": 16986.82, "Minimum Price": 16487.7 },
    { "Supplier": "LR40101", "Product Code": "LR070065", "Full Description": "SERVICE ENGINE", "Free Stock": 0, "Trade Price": 17872.82, "Band 1": 17862.35, "Band 2": 17060.25, "Band 3": 16963.84, "Band 4": 16811.87, "Minimum Price": 16318.48 },
    { "Supplier": "LR40101", "Product Code": "LR075057", "Full Description": "ENGINE - STRIPPED", "Free Stock": 0, "Trade Price": 17872.62, "Band 1": 17862.35, "Band 2": 17060.25, "Band 3": 16963.84, "Band 4": 16811.87, "Minimum Price": 16318.48 },
    { "Supplier": "LR40101", "Product Code": "LR079068", "Full Description": "ENGINE - STRIPPED", "Free Stock": 0, "Trade Price": 17872.02, "Band 1": 17862.35, "Band 2": 17060.25, "Band 3": 16963.84, "Band 4": 16811.87, "Minimum Price": 16318.48 },
    { "Supplier": "JAM0101", "Product Code": "C2W214AYUI", "Full Description": "HOOD", "Free Stock": 0, "Trade Price": 17806.00, "Band 1": 16858.18, "Band 2": 16187.35, "Band 3": 16095.8, "Band 4": 15951.7, "Minimum Price": 15443.56 },
    { "Supplier": "JAM0101", "Product Code": "C2D48670", "Full Description": "ENGINE-STRIPPED", "Free Stock": 0, "Trade Price": 17714.66, "Band 1": 16871.11, "Band 2": 16184.24, "Band 3": 16033.25, "Band 4": 15889.6, "Minimum Price": 15404.68 }
];

// Create samples directory if it doesn't exist
const fs = require('fs');
const samplesDir = path.join(__dirname, '..', 'samples');
if (!fs.existsSync(samplesDir)) {
    fs.mkdirSync(samplesDir, { recursive: true });
}

// Create workbook
const workbook = XLSX.utils.book_new();

// Convert data to worksheet
const worksheet = XLSX.utils.json_to_sheet(productData);

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
const filePath = path.join(samplesDir, 'Genuine_parts_real.xlsx');
XLSX.writeFile(workbook, filePath);

console.log(`✅ Created: ${filePath}`);
console.log(`   Rows: ${productData.length}`);
console.log('\n💡 You can now test the import with:');
console.log('   pnpm --filter worker run import:genuine');

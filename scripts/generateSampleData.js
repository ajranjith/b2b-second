const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Ensure samples directory exists
const samplesDir = path.join(__dirname, '..', 'samples');
if (!fs.existsSync(samplesDir)) {
    fs.mkdirSync(samplesDir, { recursive: true });
}

// Sample part descriptions for realistic data
const partDescriptions = [
    'Brake Pad Set - Front',
    'Brake Pad Set - Rear',
    'Brake Disc Set - Front',
    'Brake Disc Set - Rear',
    'Oil Filter 2.0L Diesel',
    'Oil Filter 3.0L Petrol',
    'Air Filter Element',
    'Cabin Air Filter',
    'Fuel Filter Assembly',
    'Spark Plug Set (4pc)',
    'Spark Plug Set (6pc)',
    'Wiper Blade Set',
    'Front Wiper Blade - Driver',
    'Front Wiper Blade - Passenger',
    'Rear Wiper Blade',
    'Headlight Bulb H7',
    'Headlight Bulb H4',
    'Fog Light Bulb',
    'Indicator Bulb',
    'Brake Light Bulb',
    'Engine Oil 5W-30 (5L)',
    'Engine Oil 10W-40 (5L)',
    'Coolant Antifreeze (5L)',
    'Brake Fluid DOT 4 (1L)',
    'Power Steering Fluid (1L)',
    'Transmission Oil ATF (1L)',
    'Timing Belt Kit',
    'Serpentine Belt',
    'Drive Belt - Alternator',
    'Water Pump Assembly',
    'Thermostat Housing',
    'Radiator Cap',
    'Expansion Tank',
    'Clutch Kit - 3 Piece',
    'Clutch Master Cylinder',
    'Clutch Slave Cylinder',
    'Shock Absorber - Front Left',
    'Shock Absorber - Front Right',
    'Shock Absorber - Rear Left',
    'Shock Absorber - Rear Right',
    'Coil Spring - Front',
    'Coil Spring - Rear',
    'Control Arm - Lower Left',
    'Control Arm - Lower Right',
    'Ball Joint - Front',
    'Tie Rod End - Left',
    'Tie Rod End - Right',
    'Wheel Bearing - Front',
    'Wheel Bearing - Rear',
    'CV Joint Boot Kit'
];

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max, decimals = 2) {
    const value = Math.random() * (max - min) + min;
    return parseFloat(value.toFixed(decimals));
}

function randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function generateDiscountCode() {
    const codes = ['DISC-A', 'DISC-B', 'DISC-C', 'DISC-D', 'DISC-E', ''];
    return randomChoice(codes);
}

function generateProductData(type, count) {
    const data = [];
    const supplier = type === 'GENUINE' ? randomChoice(['JLR Official', 'OEM Parts Co']) : 'Aftermarket Supplies';
    const prefix = type === 'GENUINE' ? 'LR' : 'AM';

    for (let i = 1; i <= count; i++) {
        const productCode = `${prefix}-${String(i).padStart(4, '0')}`;
        const description = randomChoice(partDescriptions);
        const discountCode = generateDiscountCode();

        // Generate prices ensuring Cost < Trade < Retail < List
        const costPrice = randomFloat(10, 200);
        const tradePrice = randomFloat(costPrice * 1.2, costPrice * 1.8);
        const retailPrice = randomFloat(tradePrice * 1.2, tradePrice * 1.5);
        const listPrice = randomFloat(retailPrice * 1.1, retailPrice * 1.3);

        // Calculate band prices
        const band1 = randomFloat(retailPrice * 0.95, retailPrice * 0.95);
        const band2 = randomFloat(retailPrice * 0.90, retailPrice * 0.90);
        const band3 = randomFloat(retailPrice * 0.85, retailPrice * 0.85);
        const band4 = randomFloat(retailPrice * 0.80, retailPrice * 0.80);

        const freeStock = randomInt(0, 100);

        data.push({
            'Supplier': supplier,
            'Product Code': productCode,
            'Description': description,
            'Discount Code': discountCode,
            'Cost Price': costPrice,
            'Retail Price': retailPrice,
            'Trade Price': tradePrice,
            'List Price': listPrice,
            'Band 1': band1,
            'Band 2': band2,
            'Band 3': band3,
            'Band 4': band4,
            'Free Stock': freeStock
        });
    }

    return data;
}

function createExcelFile(data, filename) {
    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Convert data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Set column widths for better readability
    const columnWidths = [
        { wch: 20 }, // Supplier
        { wch: 15 }, // Product Code
        { wch: 35 }, // Description
        { wch: 15 }, // Discount Code
        { wch: 12 }, // Cost Price
        { wch: 12 }, // Retail Price
        { wch: 12 }, // Trade Price
        { wch: 12 }, // List Price
        { wch: 10 }, // Band 1
        { wch: 10 }, // Band 2
        { wch: 10 }, // Band 3
        { wch: 10 }, // Band 4
        { wch: 12 }  // Free Stock
    ];
    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');

    // Write to file
    const filePath = path.join(samplesDir, filename);
    XLSX.writeFile(workbook, filePath);

    console.log(`✅ Created: ${filePath}`);
    console.log(`   Rows: ${data.length}`);
}

// Main execution
console.log('📊 Generating sample Excel files...\n');

// Generate GENUINE parts file
console.log('🔧 Generating GENUINE parts data...');
const genuineData = generateProductData('GENUINE', 50);
createExcelFile(genuineData, 'Genuine_parts.xlsx');

console.log('\n🔧 Generating AFTERMARKET parts data...');
const aftermarketData = generateProductData('AFTERMARKET', 50);
createExcelFile(aftermarketData, 'aftermarket_parts.xlsx');

console.log('\n✅ Sample files generated successfully!');
console.log(`\n📁 Files created in: ${samplesDir}`);
console.log('   - Genuine_parts.xlsx (50 rows)');
console.log('   - aftermarket_parts.xlsx (50 rows)');
console.log('\n💡 You can now test the import with:');
console.log('   pnpm --filter worker run import:genuine');
console.log('   pnpm --filter worker run import:aftermarket');

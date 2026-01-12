const fs = require('fs');
const path = require('path');

// Backorder data extracted from the uploaded image
const backorderData = [
    { "Account No": "1000006", "Customer Name": "JGS 4X4 Limited", "Your Order No": "7807618", "Our No": "9982", "Itm": "5", "Part": "FRC3988E", "Descriptio": "GASKET - E", "Q Ord": "100", "Q/O": "0", "In WH": "0" },
    { "Account No": "1000006", "Customer Name": "JGS 4X4 Limited", "Your Order No": "7807618", "Our No": "9982", "Itm": "6", "Part": "LR001381", "Descriptio": "NUT - WHE", "Q Ord": "50", "Q/O": "0", "In WH": "0" },
    { "Account No": "1000006", "Customer Name": "JGS 4X4 Limited", "Your Order No": "6456", "Our No": "11193", "Itm": "12", "Part": "JAM28571", "Descriptio": "WASHER", "Q Ord": "20", "Q/O": "0", "In WH": "0" },
    { "Account No": "1000006", "Customer Name": "JGS 4X4 Limited", "Your Order No": "7839801", "Our No": "11450", "Itm": "7", "Part": "FTC3648X", "Descriptio": "GASKET - E", "Q Ord": "20", "Q/O": "0", "In WH": "0" },
    { "Account No": "1000012", "Customer Name": "S.H.Levy And Sons Ltd", "Your Order No": "7310531", "Our No": "532", "Itm": "42", "Part": "LR091526", "Descriptio": "LATCH - FF", "Q Ord": "1", "Q/O": "0", "In WH": "0" },
    { "Account No": "1000012", "Customer Name": "S.H.Levy And Sons Ltd", "Your Order No": "7840357", "Our No": "12009", "Itm": "57", "Part": "LR073675", "Descriptio": "PLUG - OIL", "Q Ord": "15", "Q/O": "0", "In WH": "0" },
    { "Account No": "1000012", "Customer Name": "S.H.Levy And Sons Ltd", "Your Order No": "7840357", "Our No": "12009", "Itm": "65", "Part": "LR089235", "Descriptio": "AIR SPRING", "Q Ord": "1", "Q/O": "0", "In WH": "0" },
    { "Account No": "1000012", "Customer Name": "S.H.Levy And Sons Ltd", "Your Order No": "7840357", "Our No": "12009", "Itm": "44", "Part": "LR106748", "Descriptio": "Cover - Do", "Q Ord": "1", "Q/O": "0", "In WH": "0" },
    { "Account No": "1000026", "Customer Name": "Autopost Limited", "Your Order No": "7839462", "Our No": "11194", "Itm": "6", "Part": "LR142281", "Descriptio": "SPROCKET", "Q Ord": "1", "Q/O": "0", "In WH": "0" },
    { "Account No": "1000026", "Customer Name": "Autopost Limited", "Your Order No": "7839796", "Our No": "11445", "Itm": "5", "Part": "563132X", "Descriptio": "BELT - DAY", "Q Ord": "3", "Q/O": "0", "In WH": "0" },
    { "Account No": "1000026", "Customer Name": "Autopost Limited", "Your Order No": "7850242", "Our No": "16696", "Itm": "1", "Part": "LR097165", "Descriptio": "XK XF XE N", "Q Ord": "2", "Q/O": "0", "In WH": "0" },
    { "Account No": "1000033", "Customer Name": "Lof Engineering Ltd", "Your Order No": "7311828", "Our No": "4044", "Itm": "1", "Part": "SJG10024", "Descriptio": "BRAKE SEF", "Q Ord": "10", "Q/O": "0", "In WH": "0" },
    { "Account No": "1000041", "Customer Name": "Discount Mg Rover Spares Limited", "Your Order No": "7806881", "Our No": "8927", "Itm": "1", "Part": "JPB50013", "Descriptio": "COOLANT", "Q Ord": "4", "Q/O": "0", "In WH": "0" },
    { "Account No": "1000041", "Customer Name": "Discount Mg Rover Spares Limited", "Your Order No": "7842142", "Our No": "12886", "Itm": "1", "Part": "PEP10327", "Descriptio": "COOLANT", "Q Ord": "30", "Q/O": "0", "In WH": "5" },
    { "Account No": "1000041", "Customer Name": "Discount Mg Rover Spares Limited", "Your Order No": "7850038", "Our No": "16586", "Itm": "1", "Part": "LYX10068", "Descriptio": "O RING - E", "Q Ord": "7", "Q/O": "0", "In WH": "0" },
    { "Account No": "1000042", "Customer Name": "Famous Four Products Limited", "Your Order No": "7312539", "Our No": "5696", "Itm": "5", "Part": "ANR2855E", "Descriptio": "EYE END -", "Q Ord": "1", "Q/O": "0", "In WH": "0" },
    { "Account No": "1000042", "Customer Name": "Famous Four Products Limited", "Your Order No": "7842413", "Our No": "13215", "Itm": "7", "Part": "LRW110", "Descriptio": "WIPER MO-", "Q Ord": "1", "Q/O": "0", "In WH": "0" },
    { "Account No": "1000042", "Customer Name": "Famous Four Products Limited", "Your Order No": "7848360", "Our No": "15977", "Itm": "3", "Part": "S1C1286R", "Descriptio": "SERVO 8.5", "Q Ord": "2", "Q/O": "0", "In WH": "0" },
    { "Account No": "1000042", "Customer Name": "Famous Four Products Limited", "Your Order No": "7848360", "Our No": "15977", "Itm": "4", "Part": "ANR2003E", "Descriptio": "PAS PUMP", "Q Ord": "100", "Q/O": "0", "In WH": "47" },
    { "Account No": "1000043", "Customer Name": "Bearbones 4X4 Ltd", "Your Order No": "7310709", "Our No": "910", "Itm": "22", "Part": "MWC5018", "Descriptio": "CHECK - D", "Q Ord": "20", "Q/O": "0", "In WH": "0" },
    { "Account No": "1000043", "Customer Name": "Bearbones 4X4 Ltd", "Your Order No": "7310709", "Our No": "910", "Itm": "23", "Part": "MWC5019", "Descriptio": "CHECK - D", "Q Ord": "20", "Q/O": "0", "In WH": "0" },
    { "Account No": "1000043", "Customer Name": "Bearbones 4X4 Ltd", "Your Order No": "7310892", "Our No": "1422", "Itm": "1", "Part": "NTC2676E", "Descriptio": "FUEL FILLE", "Q Ord": "10", "Q/O": "0", "In WH": "0" },
    { "Account No": "1000043", "Customer Name": "Bearbones 4X4 Ltd", "Your Order No": "7311279", "Our No": "2555", "Itm": "12", "Part": "LR105975", "Descriptio": "THERMOS", "Q Ord": "1", "Q/O": "0", "In WH": "0" },
    { "Account No": "1000043", "Customer Name": "Bearbones 4X4 Ltd", "Your Order No": "7311736", "Our No": "3842", "Itm": "6", "Part": "NRC1269E", "Descriptio": "RELAY", "Q Ord": "3", "Q/O": "0", "In WH": "0" },
    { "Account No": "1000043", "Customer Name": "Bearbones 4X4 Ltd", "Your Order No": "7311736", "Our No": "3842", "Itm": "11", "Part": "AMR1495E", "Descriptio": "SENSOR - I", "Q Ord": "10", "Q/O": "0", "In WH": "0" },
    { "Account No": "1000043", "Customer Name": "Bearbones 4X4 Ltd", "Your Order No": "7311736", "Our No": "3842", "Itm": "14", "Part": "LVP00002", "Descriptio": "GASKET - E", "Q Ord": "20", "Q/O": "0", "In WH": "0" },
    { "Account No": "1000043", "Customer Name": "Bearbones 4X4 Ltd", "Your Order No": "7311736", "Our No": "3842", "Itm": "15", "Part": "LR001127", "Descriptio": "WHEEL HL", "Q Ord": "2", "Q/O": "0", "In WH": "0" },
    { "Account No": "1000043", "Customer Name": "Bearbones 4X4 Ltd", "Your Order No": "7311989", "Our No": "4383", "Itm": "7", "Part": "AFU4241L", "Descriptio": "SWITCH EL", "Q Ord": "50", "Q/O": "0", "In WH": "0" },
    { "Account No": "1000043", "Customer Name": "Bearbones 4X4 Ltd", "Your Order No": "7311989", "Our No": "4383", "Itm": "11", "Part": "RGD1004E", "Descriptio": "ARM AND I", "Q Ord": "6", "Q/O": "0", "In WH": "0" }
];

// Convert to CSV format
function arrayToCSV(data) {
    if (data.length === 0) return '';

    // Get headers
    const headers = Object.keys(data[0]);

    // Create CSV rows
    const csvRows = [
        headers.join(','), // Header row
        ...data.map(row =>
            headers.map(header => {
                const value = row[header];
                // Escape values that contain commas or quotes
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            }).join(',')
        )
    ];

    return csvRows.join('\n');
}

// Ensure samples directory exists
const samplesDir = path.join(__dirname, '..', 'samples');
if (!fs.existsSync(samplesDir)) {
    fs.mkdirSync(samplesDir, { recursive: true });
}

// Write CSV file
const csvContent = arrayToCSV(backorderData);
const filePath = path.join(samplesDir, 'backorders.csv');
fs.writeFileSync(filePath, csvContent, 'utf8');

console.log(`✅ Created: ${filePath}`);
console.log(`   Rows: ${backorderData.length}`);
console.log('\n💡 You can now test the backorder import with:');
console.log('   pnpm --filter worker run import:backorders');

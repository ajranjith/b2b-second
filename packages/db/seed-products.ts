import { PrismaClient, PartType } from '@prisma/client';

const prisma = new PrismaClient();

const genuineParts = [
    { code: 'LR071485', supplier: 'LR071485', desc: 'WIRING - ENGINE COMPARTMENT', stock: 0, trade: 2348.85, band1: 2231.41, band2: 2113.97, band3: 2106.22, band4: 2096.48, min: 2045.15 },
    { code: 'LR126452', supplier: 'LR126452', desc: 'COVER - FRONT SEAT BACK', stock: 0, trade: 1355.67, band1: 1287.89, band2: 1220.1, band3: 1213.32, band4: 1206.55, min: 1179.43 },
    { code: 'LNN0006', supplier: 'LNN0006', desc: 'MODULE- ENGINE CONTROL - EEC IV', stock: 0, trade: 1201.92, band1: 1141.82, band2: 1081.73, band3: 1076.79, band4: 1069.71, min: 1044.67 },
    { code: 'LR174236', supplier: 'LR174236', desc: 'Intercooler Rear', stock: 0, trade: 1196.49, band1: 1136.67, band2: 1076.84, band3: 1070.86, band4: 1064.88, min: 1040.95 },
    { code: 'LR135922', supplier: 'LR135922', desc: 'SPOILER - REAR', stock: 0, trade: 1573.56, band1: 1494.88, band2: 1416.2, band3: 1408.34, band4: 1400.47, min: 1368 },
    { code: 'T2R21789', supplier: 'T2R21789', desc: 'HARNESS -BODY', stock: 0, trade: 2828.61, band1: 2687.18, band2: 2545.75, band3: 2531.61, band4: 2517.46, min: 2460.89 },
    { code: 'LR156195', supplier: 'LR156195', desc: 'CONSOLE - CENTRE FLOOR', stock: 0, trade: 19124.47, band1: 18168.25, band2: 17212.02, band3: 17116.4, band4: 17020.78, min: 16636.29 },
    { code: 'T2R11119', supplier: 'T2R11119', desc: 'HARNESS -BODY', stock: 0, trade: 1601.66, band1: 1521.58, band2: 1441.49, band3: 1433.49, band4: 1425.48, min: 1393.44 },
    { code: 'T4A47708', supplier: 'T4A47708', desc: 'HARNESS', stock: 0, trade: 1408.85, band1: 1338.41, band2: 1267.96, band3: 1260.92, band4: 1253.88, min: 1225.7 },
    { code: 'T2R3971AA', supplier: 'T2R3971AA', desc: 'PACK', stock: 0, trade: 1716.34, band1: 1630.52, band2: 1544.71, band3: 1536.12, band4: 1527.54, min: 1493.2 },
    { code: 'T4A47601', supplier: 'T4A47601', desc: 'HARNESS', stock: 0, trade: 1226.62, band1: 1165.29, band2: 1103.96, band3: 1097.82, band4: 1091.69, min: 1067.16 },
    { code: 'LR052733', supplier: 'LR052733', desc: 'WIRING - ENGINE COMPARTMENT', stock: 0, trade: 2143.08, band1: 2035.93, band2: 1928.77, band3: 1918.06, band4: 1907.34, min: 1864.48 },
    { code: 'S31124660', supplier: 'S31124660', desc: 'Console - With Armrest', stock: 0, trade: 1853.26, band1: 1760.6, band2: 1667.93, band3: 1658.67, band4: 1649.4, min: 1612.34 },
    { code: 'C2C56734LH', supplier: 'C2C56734LH', desc: 'COVER-CUSHION', stock: 0, trade: 2259.71, band1: 2146.72, band2: 2033.74, band3: 2022.4, band4: 2011.14, min: 1965.95 },
    { code: '98C2638DE', supplier: '98C2638DE', desc: 'GEARBOX-AUTOMATIC', stock: 0, trade: 5773.17, band1: 5484.51, band2: 5195.85, band3: 5166.99, band4: 5138.12, min: 5022.66 },
    { code: 'T2R06051CVE', supplier: 'T2R06051CVE', desc: 'COVER-SQUAB', stock: 0, trade: 1332.28, band1: 1265.67, band2: 1199.05, band3: 1192.39, band4: 1185.73, min: 1159.08 },
    { code: 'LR144951', supplier: 'LR144951', desc: 'WIRING - ENGINE COMPARTMENT', stock: 0, trade: 1452.88, band1: 1380.24, band2: 1307.59, band3: 1300.33, band4: 1293.06, min: 1264.01 },
    { code: 'T4A14492', supplier: 'T4A14492', desc: 'HARNESS', stock: 0, trade: 1594.13, band1: 1514.42, band2: 1434.72, band3: 1426.75, band4: 1418.78, min: 1386.89 },
    { code: 'T2H27531', supplier: 'T2H27531', desc: 'HARNESS', stock: 0, trade: 1920.87, band1: 1824.83, band2: 1728.78, band3: 1719.18, band4: 1709.57, min: 1671.16 },
    { code: 'S31124961', supplier: 'S31124961', desc: 'Console - With Armrest', stock: 0, trade: 2038.08, band1: 1936.18, band2: 1834.27, band3: 1824.08, band4: 1813.89, min: 1773.17 },
    { code: 'A8J13980', supplier: 'A8J13980', desc: 'HARNESS -ENGINE', stock: 0, trade: 1723.12, band1: 1636.96, band2: 1550.81, band3: 1542.19, band4: 1533.58, min: 1499.11 },
    { code: 'B0356841', supplier: 'B0356841', desc: 'PANEL - RAW', stock: 0, trade: 1934.49, band1: 1837.77, band2: 1741.04, band3: 1731.37, band4: 1721.7, min: 1683.01 },
    { code: 'C2D53227', supplier: 'C2D53227', desc: 'PANEL DOOR VENEER', stock: 0, trade: 1075.79, band1: 1022, band2: 968.21, band3: 962.83, band4: 957.45, min: 935.49 },
    { code: 'T4K11623', supplier: 'T4K11623', desc: 'CROSSMEMBER', stock: 0, trade: 1180.42, band1: 1121.4, band2: 1062.38, band3: 1056.48, band4: 1050.57, min: 1026.97 },
    { code: 'C2P10312YN', supplier: 'C2P10312YN', desc: 'PACK', stock: 0, trade: 4253.32, band1: 4040.65, band2: 3827.99, band3: 3806.72, band4: 3785.45, min: 3700.39 },
    { code: 'LR165827', supplier: 'LR165827', desc: 'WIRING - ENGINE COMPARTMENT', stock: 0, trade: 1178.63, band1: 1119.7, band2: 1060.77, band3: 1054.87, band4: 1048.98, min: 1025.41 },
    { code: 'T2R19539', supplier: 'T2R19539', desc: 'HARNESS -BODY', stock: 0, trade: 3411.14, band1: 3240.58, band2: 3070.03, band3: 3052.97, band4: 3035.91, min: 2967.69 },
    { code: 'LR063494', supplier: 'LR063494', desc: 'WIRING - MAIN', stock: 0, trade: 4262.63, band1: 4049.5, band2: 3836.37, band3: 3815.05, band4: 3793.74, min: 3708.49 },
    { code: 'LR136497', supplier: 'LR136497', desc: 'COVER - REAR SEAT CUSHION', stock: 0, trade: 1195.76, band1: 1135.97, band2: 1076.18, band3: 1070.21, band4: 1064.23, min: 1040.31 },
    { code: 'LR060112', supplier: 'LR060112', desc: 'Harness - Main', stock: 0, trade: 2197.11, band1: 2087.25, band2: 1977.4, band3: 1966.41, band4: 1955.43, min: 1911.49 },
    { code: 'C2D57737', supplier: 'C2D57737', desc: 'HARNESS -BODY', stock: 0, trade: 2844.15, band1: 2701.94, band2: 2559.74, band3: 2545.51, band4: 2531.29, min: 2474.14 },
    { code: 'C2C36245', supplier: 'C2C36245', desc: 'COVER-SQUAB', stock: 0, trade: 1517.09, band1: 1441.24, band2: 1365.38, band3: 1357.8, band4: 1350.21, min: 1319.87 }
];

const brandedParts = [
    { code: 'LR110026', supplier: 'LR110026', desc: 'GASKET - ELRING - KIS', stock: 0, trade: 0.76, band1: 0.72, band2: 0.68, band3: 0.68, band4: 0.68, min: 0.66 },
    { code: '698199', supplier: '698199', desc: 'AIR FILTER - VALEO', stock: 0, trade: 4.88, band1: 4.64, band2: 4.39, band3: 4.37, band4: 4.34, min: 4.25 },
    { code: 'RTC3524', supplier: 'RTC3524', desc: 'CONNECTOR - LUCAS', stock: 0, trade: 2.42, band1: 2.3, band2: 2.18, band3: 2.17, band4: 2.15, min: 2.11 },
    { code: 'ERC8450H', supplier: 'ERC8450H', desc: 'GLOW PLUG - HELLA', stock: 0, trade: 4.83, band1: 4.59, band2: 4.35, band3: 4.32, band4: 4.3, min: 4.2 },
    { code: 'C2D19766D', supplier: 'C2D19766D', desc: 'KIT XE JO - DRIVE BELT - DAYCO', stock: 25, trade: 11.15, band1: 10.59, band2: 10.04, band3: 9.98, band4: 9.92, min: 9.7 },
    { code: 'PHD12817', supplier: 'PHD12817', desc: 'BLOWER ARM BUSH REAR - POWERFLEX', stock: 0, trade: 68.57, band1: 65.14, band2: 61.71, band3: 61.37, band4: 61.03, min: 59.66 },
    { code: 'S2044114', supplier: 'S2044114', desc: 'FRT DISC ROTOR 10" 500ABARTH MCA', stock: 0, trade: 73.68, band1: 70, band2: 66.31, band3: 65.94, band4: 65.58, min: 64.1 },
    { code: 'S9J231', supplier: 'S9J231', desc: 'GRINDER - CLUTCH SLAVE - SACHS', stock: 0, trade: 10.82, band1: 10.28, band2: 9.74, band3: 9.68, band4: 9.63, min: 9.41 },
    { code: 'XFB50032', supplier: 'XFB50032', desc: 'REAR LAMP RANGE ROVER (D4) VIN 6A ON - HELLA', stock: 0, trade: 150.1, band1: 142.59, band2: 135.09, band3: 134.34, band4: 133.59, min: 130.59 },
    { code: 'C6C2517', supplier: 'C6C2517', desc: 'ACTUATOR-SPRING-GENUINE', stock: 47, trade: 1.17, band1: 1.11, band2: 1.05, band3: 1.05, band4: 1.04, min: 1.02 },
    { code: 'SHB50017', supplier: 'SHB50017', desc: 'BRAKE HOSE ASSEMBLY - DELPHI', stock: 0, trade: 19.26, band1: 18.3, band2: 17.33, band3: 17.24, band4: 17.14, min: 16.76 },
    { code: 'C2P10564', supplier: 'C2P10564', desc: 'COATED BRAKE DISC GENUINE (HC VV - DELPHI', stock: 4, trade: 68.87, band1: 65.43, band2: 61.98, band3: 61.64, band4: 61.29, min: 59.92 },
    { code: 'S5400', supplier: 'S5400', desc: 'HEAD/AMP MOUNTING BOWL - WIPAC', stock: 0, trade: 18.18, band1: 17.27, band2: 16.36, band3: 16.27, band4: 16.18, min: 15.82 },
    { code: 'S90057', supplier: 'S90057', desc: 'COMPRESSOR - AIR CONDITIONING', stock: 0, trade: 230.84, band1: 219.3, band2: 207.76, band3: 206.6, band4: 205.45, min: 200.83 },
    { code: 'JTC384', supplier: 'JTC384', desc: 'ARM - CONTROL - TRW', stock: 0, trade: 36.08, band1: 34.28, band2: 32.47, band3: 32.29, band4: 32.11, min: 31.39 },
    { code: 'T2R13126', supplier: 'T2R13126', desc: 'SPRING-ROW - EM SUSPENSION', stock: 40, trade: 9.4, band1: 8.93, band2: 8.46, band3: 8.41, band4: 8.37, min: 8.18 },
    { code: 'ETC8751E', supplier: 'ETC8751E', desc: 'TURBOCHARGER REMAN - REMAN - ES', stock: 0, trade: 366.73, band1: 348.39, band2: 330.06, band3: 328.22, band4: 326.39, min: 319.06 },
    { code: 'SHB00830', supplier: 'SHB00830', desc: 'BRAKE HOSE - BREMI', stock: 0, trade: 20.47, band1: 19.45, band2: 18.42, band3: 18.32, band4: 18.22, min: 17.81 },
    { code: 'LRD19663', supplier: 'LRD19663', desc: 'RETAINER CYL HEAD COVER 2.4 DURATORQ - ELRING', stock: 0, trade: 2.7, band1: 2.56, band2: 2.43, band3: 2.42, band4: 2.4, min: 2.35 },
    { code: 'LRD56138', supplier: 'LRD56138', desc: 'PCKG FILTER - MANN', stock: 444, trade: 19.48, band1: 18.51, band2: 17.53, band3: 17.43, band4: 17.34, min: 16.95 },
    { code: 'C2S39552', supplier: 'C2S39552', desc: 'LINK ANTI ROLL BAR - DELPHI', stock: 1, trade: 11.64, band1: 11.06, band2: 10.48, band3: 10.42, band4: 10.36, min: 10.13 },
    { code: 'LR126074', supplier: 'LR126074', desc: 'LAND ROVER DISCOVERY SPORT 15- RR CHN BUILT WINI', stock: 20, trade: 47.26, band1: 44.9, band2: 42.53, band3: 42.3, band4: 42.06, min: 41.12 },
    { code: 'LRD29941', supplier: 'LRD29941', desc: 'BEARING - LNOS/LNOS', stock: 0, trade: 0.91, band1: 0.86, band2: 0.82, band3: 0.81, band4: 0.81, min: 0.79 },
    { code: 'S5190212', supplier: 'S5190212', desc: 'T/B COVER LEFT /13/5T5', stock: 0, trade: 33.28, band1: 31.62, band2: 29.95, band3: 29.79, band4: 29.62, min: 28.95 },
    { code: 'C2674D', supplier: 'C2674D', desc: 'TRAILER LIMOUSINE - IDLER SPROCKET - EAC PARTS', stock: 2, trade: 38.32, band1: 36.4, band2: 34.49, band3: 34.3, band4: 34.1, min: 33.34 },
    { code: 'LHN10042', supplier: 'LHN10042', desc: 'BELT - DAYCO', stock: 11, trade: 7.19, band1: 6.83, band2: 6.47, band3: 6.44, band4: 6.4, min: 6.26 }
];

const aftermarketParts = [
    { code: 'LR011870', supplier: 'JOL0101', desc: 'WRENCH -', stock: 100, trade: 4.8, band1: 4.56, band2: 4.32, band3: 4.3, band4: 4.27, min: 4.18 },
    { code: 'LR000094', supplier: 'JAL0101', desc: 'BOLT - HEX', stock: 0, trade: 2.1, band1: 1.99, band2: 1.89, band3: 1.88, band4: 1.87, min: 1.83 },
    { code: 'FRC7871F', supplier: 'NWB0101', desc: 'BEARING -', stock: 47, trade: 5.26, band1: 5, band2: 4.73, band3: 4.71, band4: 4.68, min: 4.58 },
    { code: 'AMR3321', supplier: 'SLA0101', desc: 'SENSOR - I', stock: 136, trade: 3.55, band1: 3.37, band2: 3.19, band3: 3.18, band4: 3.16, min: 3.09 },
    { code: 'C2D28707', supplier: 'XXK0101', desc: 'SENSOR-O', stock: 30, trade: 30.49, band1: 28.97, band2: 27.44, band3: 27.29, band4: 27.14, min: 26.53 },
    { code: 'LR035031', supplier: 'CLI0101', desc: 'GASKET - f', stock: 0, trade: 7.79, band1: 7.4, band2: 7.01, band3: 6.97, band4: 6.93, min: 6.78 },
    { code: 'MJA1830A', supplier: 'FPS0101', desc: 'BEARING -', stock: 3, trade: 33.68, band1: 32, band2: 30.31, band3: 30.14, band4: 29.98, min: 29.3 },
    { code: 'C2Z2200E', supplier: 'WPA0101', desc: 'WHEEL HU', stock: 112, trade: 10, band1: 9.5, band2: 9, band3: 8.95, band4: 8.9, min: 8.7 },
    { code: 'LR018173', supplier: 'SLA0101', desc: 'CLIP - RET', stock: 134, trade: 1.45, band1: 1.38, band2: 1.3, band3: 1.3, band4: 1.29, min: 1.26 },
    { code: 'LRA22069', supplier: 'PAN0101', desc: 'BLANKING', stock: 3, trade: 22.81, band1: 21.67, band2: 20.53, band3: 20.41, band4: 20.3, min: 19.84 },
    { code: 'DRC1752', supplier: 'DIP0101', desc: 'BALLAST R', stock: 0, trade: 6.21, band1: 5.9, band2: 5.59, band3: 5.56, band4: 5.53, min: 5.4 },
    { code: 'RUB50033', supplier: 'JAL0101', desc: 'STEERING', stock: 27, trade: 60.54, band1: 57.51, band2: 54.49, band3: 54.18, band4: 53.88, min: 52.67 },
    { code: 'AEU2147L', supplier: 'JAL0101', desc: 'FILTER - FL', stock: 341, trade: 2.57, band1: 2.44, band2: 2.31, band3: 2.3, band4: 2.29, min: 2.24 },
    { code: 'LR004369', supplier: 'HND0101', desc: 'BOLT CYLI', stock: 0, trade: 1.4, band1: 1.33, band2: 1.26, band3: 1.25, band4: 1.25, min: 1.22 },
    { code: 'ERR3539E', supplier: 'JAL0101', desc: 'PUMP - VA', stock: 5, trade: 56.96, band1: 54.11, band2: 51.26, band3: 50.98, band4: 50.69, min: 49.56 },
    { code: 'LR117659', supplier: 'SLA0101', desc: 'BLADE - W', stock: 176, trade: 1.8, band1: 1.71, band2: 1.62, band3: 1.61, band4: 1.6, min: 1.57 },
    { code: 'C4124Y', supplier: 'HND0101', desc: 'XK - ENGIN', stock: 29, trade: 0.87, band1: 0.83, band2: 0.78, band3: 0.78, band4: 0.77, min: 0.76 },
    { code: 'PNT10003', supplier: 'HND0101', desc: 'GASKET - f', stock: 240, trade: 0.6, band1: 0.57, band2: 0.54, band3: 0.54, band4: 0.53, min: 0.52 },
    { code: 'JDE39603ES', supplier: 'OSS0101', desc: 'OIL FILTER', stock: 0, trade: 51.36, band1: 48.79, band2: 46.22, band3: 45.97, band4: 45.71, min: 44.68 },
    { code: '19C31880', supplier: 'CIA0101', desc: 'REGULATC', stock: 0, trade: 63.87, band1: 60.68, band2: 57.48, band3: 57.16, band4: 56.84, min: 55.57 },
    { code: 'HGS009N', supplier: 'HND0101', desc: 'GASKET SE', stock: 5, trade: 211.3, band1: 200.74, band2: 190.17, band3: 189.11, band4: 188.06, min: 183.83 },
    { code: 'LR069002', supplier: 'SLA0101', desc: 'HOSE-FUE', stock: 0, trade: 39.62, band1: 37.64, band2: 35.66, band3: 35.46, band4: 35.26, min: 34.47 },
    { code: 'AOU11000', supplier: 'CAV0101', desc: 'PLATE - SP', stock: 0, trade: 21.49, band1: 20.42, band2: 19.34, band3: 19.23, band4: 19.13, min: 18.7 },
    { code: 'STC3338E', supplier: 'HAQ0101', desc: 'THERMOS', stock: 30, trade: 3.11, band1: 2.95, band2: 2.8, band3: 2.78, band4: 2.77, min: 2.71 }
];

async function seedProducts() {
    console.log('🌱 Starting product seed...\n');

    try {
        let totalCreated = 0;

        // Insert Genuine Parts
        console.log('📦 Inserting Genuine Parts...');
        for (const part of genuineParts) {
            const product = await prisma.product.create({
                data: {
                    productCode: part.code,
                    supplier: part.supplier,
                    description: part.desc,
                    partType: PartType.GENUINE,
                    isActive: true,
                    stock: {
                        create: {
                            freeStock: part.stock
                        }
                    },
                    refPrice: {
                        create: {
                            tradePrice: new Decimal(part.trade),
                            minimumPrice: new Decimal(part.min)
                        }
                    },
                    bandPrices: {
                        create: [
                            { bandCode: '1', price: new Decimal(part.band1) },
                            { bandCode: '2', price: new Decimal(part.band2) },
                            { bandCode: '3', price: new Decimal(part.band3) },
                            { bandCode: '4', price: new Decimal(part.band4) }
                        ]
                    }
                }
            });
            totalCreated++;
        }
        console.log(`✅ Created ${genuineParts.length} genuine parts`);

        // Insert Branded Parts
        console.log('\n📦 Inserting Branded Parts...');
        for (const part of brandedParts) {
            const product = await prisma.product.create({
                data: {
                    productCode: part.code,
                    supplier: part.supplier,
                    description: part.desc,
                    partType: PartType.BRANDED,
                    isActive: true,
                    stock: {
                        create: {
                            freeStock: part.stock
                        }
                    },
                    refPrice: {
                        create: {
                            tradePrice: new Decimal(part.trade),
                            minimumPrice: new Decimal(part.min)
                        }
                    },
                    bandPrices: {
                        create: [
                            { bandCode: '1', price: new Decimal(part.band1) },
                            { bandCode: '2', price: new Decimal(part.band2) },
                            { bandCode: '3', price: new Decimal(part.band3) },
                            { bandCode: '4', price: new Decimal(part.band4) }
                        ]
                    }
                }
            });
            totalCreated++;
        }
        console.log(`✅ Created ${brandedParts.length} branded parts`);

        // Insert Aftermarket Parts
        console.log('\n📦 Inserting Aftermarket Parts...');
        for (const part of aftermarketParts) {
            const product = await prisma.product.create({
                data: {
                    productCode: part.code,
                    supplier: part.supplier,
                    description: part.desc,
                    partType: PartType.AFTERMARKET,
                    isActive: true,
                    stock: {
                        create: {
                            freeStock: part.stock
                        }
                    },
                    refPrice: {
                        create: {
                            tradePrice: new Decimal(part.trade),
                            minimumPrice: new Decimal(part.min)
                        }
                    },
                    bandPrices: {
                        create: [
                            { bandCode: '1', price: new Decimal(part.band1) },
                            { bandCode: '2', price: new Decimal(part.band2) },
                            { bandCode: '3', price: new Decimal(part.band3) },
                            { bandCode: '4', price: new Decimal(part.band4) }
                        ]
                    }
                }
            });
            totalCreated++;
        }
        console.log(`✅ Created ${aftermarketParts.length} aftermarket parts`);

        console.log(`\n✅ Product seed completed successfully!`);
        console.log(`\n📊 Summary:`);
        console.log(`   - Total products created: ${totalCreated}`);
        console.log(`   - Genuine: ${genuineParts.length}`);
        console.log(`   - Branded: ${brandedParts.length}`);
        console.log(`   - Aftermarket: ${aftermarketParts.length}`);

    } catch (error) {
        console.error('\n❌ Product seed failed:', error);
        throw error;
    }
}

seedProducts()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

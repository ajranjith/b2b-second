import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../../packages/db/.env') });
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, ImportType } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as crypto from 'crypto';
import * as fs from 'fs';
import { SpecialPriceImportService } from './services/SpecialPriceImportService';

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

interface ImportArgs {
  file: string;
  startDate: string;
  endDate: string;
}

function parseArgs(): ImportArgs {
  const args = process.argv.slice(2);
  const fileIndex = args.indexOf('--file');
  const startDateIndex = args.indexOf('--start-date');
  const endDateIndex = args.indexOf('--end-date');

  if (fileIndex === -1 || startDateIndex === -1 || endDateIndex === -1) {
    console.error('❌ Usage: ts-node importSpecialPrices.ts --file <path-to-xlsx> --start-date <YYYY-MM-DD> --end-date <YYYY-MM-DD>');
    console.error('   Example: ts-node importSpecialPrices.ts --file /mnt/data/Aftermarket_ES_10_DiscountPrice_4cols.xlsx --start-date 2026-02-01 --end-date 2026-02-28');
    process.exit(1);
  }

  const file = args[fileIndex + 1];
  const startDate = args[startDateIndex + 1];
  const endDate = args[endDateIndex + 1];

  if (!file) {
    console.error('❌ File path is required');
    process.exit(1);
  }

  if (!startDate || !endDate) {
    console.error('❌ Start date and end date are required (format: YYYY-MM-DD)');
    process.exit(1);
  }

  // Validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
    console.error('❌ Invalid date format. Use YYYY-MM-DD');
    process.exit(1);
  }

  return { file, startDate, endDate };
}

function calculateFileHash(filePath: string): string {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

async function main() {
  const { file, startDate, endDate } = parseArgs();

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('💰 SPECIAL PRICE IMPORTER (Date-Ranged Pricing)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`   File:       ${file}`);
  console.log(`   Start Date: ${startDate}`);
  console.log(`   End Date:   ${endDate}\n`);

  // Parse dates
  const parsedStartDate = new Date(startDate);
  const parsedEndDate = new Date(endDate);

  // Validate date range
  if (parsedStartDate >= parsedEndDate) {
    console.error('❌ Start date must be before end date');
    process.exit(1);
  }

  // Resolve file path
  const filePath = path.isAbsolute(file) ? file : path.resolve(process.cwd(), file);

  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }

  // Calculate file hash
  const fileHash = calculateFileHash(filePath);
  console.log(`🔐 File hash: ${fileHash.substring(0, 16)}...`);

  // Create import service with date range options
  const importService = new SpecialPriceImportService(prisma, {
    startDate: parsedStartDate,
    endDate: parsedEndDate
  });

  // Create import batch
  console.log('\n📝 Creating import batch...');
  const batch = await importService.createBatch(
    ImportType.SPECIAL_PRICES,
    path.basename(filePath),
    fileHash,
    filePath
  );
  console.log(`✅ Import batch created: ${batch.id}`);

  try {
    // Read Excel file
    console.log('\n📊 Parsing Excel file...');
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet);

    console.log(`   Found ${rows.length} rows`);

    // Validate columns
    console.log('\n🔍 Validating columns...');
    const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
    const columnValidation = importService.validateColumns(headers);

    if (!columnValidation.valid) {
      console.error('❌ Missing required columns:');
      columnValidation.missing.forEach(col => console.error(`   - ${col}`));

      await importService.markBatchFailed(
        batch.id,
        new Error(`Missing required columns: ${columnValidation.missing.join(', ')}`)
      );

      process.exit(1);
    }

    console.log('✅ All required columns present');

    // Update total rows
    await prisma.importBatch.update({
      where: { id: batch.id },
      data: { totalRows: rows.length }
    });

    let validCount = 0;
    let invalidCount = 0;

    console.log('\n📋 Processing rows...');

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i] as any;
      const rowNumber = i + 2; // Excel rows start at 1, header is row 1

      // Parse and validate row
      const parsedRow = importService.parseRow(row, batch.id, rowNumber);

      // Insert into staging table
      await prisma.stgSpecialPriceRow.create({
        data: {
          batchId: parsedRow.batchId,
          rowNumber: parsedRow.rowNumber,
          partNo: parsedRow.partNo,
          partNoNormalized: parsedRow.partNoNormalized,
          discountCode: parsedRow.discountCode,
          description: parsedRow.description,
          discountPrice: parsedRow.discountPrice,
          isValid: parsedRow.isValid,
          validationErrors: parsedRow.validationErrors,
          rawRowJson: parsedRow.rawRowJson
        }
      });

      if (parsedRow.isValid) {
        validCount++;
      } else {
        invalidCount++;

        // Log validation errors
        await importService.logError(
          batch.id,
          rowNumber,
          parsedRow.validationErrors || 'Validation failed',
          undefined,
          'VALIDATION_ERROR',
          row
        );
      }

      // Progress indicator
      if ((i + 1) % 50 === 0) {
        console.log(`   Processed ${i + 1}/${rows.length} rows (${validCount} valid, ${invalidCount} invalid)`);
      }
    }

    console.log(`\n✅ Row validation complete:`);
    console.log(`   Total: ${rows.length}`);
    console.log(`   Valid: ${validCount}`);
    console.log(`   Invalid: ${invalidCount}`);

    if (validCount === 0) {
      console.error('\n❌ No valid rows to process');
      await importService.finishBatch(batch.id, {
        total: rows.length,
        valid: validCount,
        invalid: invalidCount
      });
      process.exit(1);
    }

    // Process valid rows (UPSERT special prices)
    console.log('\n🔄 Upserting special prices into database...');
    const processedCount = await importService.processValidRows(batch.id);

    // Finish batch
    await importService.finishBatch(batch.id, {
      total: rows.length,
      valid: validCount,
      invalid: invalidCount
    });

    // Generate statistics
    console.log('\n📊 Generating statistics...');

    const totalSpecialPrices = await prisma.specialPrice.count();
    const activeSpecialPrices = await prisma.specialPrice.count({
      where: {
        startDate: { lte: new Date() },
        endDate: { gte: new Date() }
      }
    });

    const thisRangeCount = await prisma.specialPrice.count({
      where: {
        startDate: parsedStartDate,
        endDate: parsedEndDate
      }
    });

    // Check for date overlap warnings
    const overlappingPrices = await prisma.specialPrice.groupBy({
      by: ['productId'],
      where: {
        OR: [
          {
            startDate: { gte: parsedStartDate, lte: parsedEndDate }
          },
          {
            endDate: { gte: parsedStartDate, lte: parsedEndDate }
          },
          {
            startDate: { lte: parsedStartDate },
            endDate: { gte: parsedEndDate }
          }
        ]
      },
      _count: { productId: true },
      having: {
        productId: { _count: { gt: 1 } }
      }
    });

    // Generate final report
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 FINAL IMPORT REPORT');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Import Batch ID:          ${batch.id}`);
    console.log(`Total Rows:               ${rows.length}`);
    console.log(`Valid Rows:               ${validCount}`);
    console.log(`Invalid Rows:             ${invalidCount}`);
    console.log(`Processed:                ${processedCount}`);
    console.log(`\nSpecial Price Statistics:`);
    console.log(`Total Special Prices:     ${totalSpecialPrices}`);
    console.log(`Active Today:             ${activeSpecialPrices}`);
    console.log(`This Date Range:          ${thisRangeCount}`);
    console.log(`Date Range:               ${startDate} to ${endDate}`);

    const finalBatch = await prisma.importBatch.findUnique({
      where: { id: batch.id }
    });
    console.log(`Final Status:             ${finalBatch?.status}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (invalidCount > 0) {
      console.log('⚠️  Some rows had validation errors. Check ImportError table for details.');
      console.log(`   Query: SELECT * FROM "ImportError" WHERE "batchId" = '${batch.id}';\n`);
    }

    if (overlappingPrices.length > 0) {
      console.log('⚠️  Overlapping special prices detected:');
      console.log(`   ${overlappingPrices.length} products have multiple special prices in overlapping date ranges.`);
      console.log(`   The most recent special price will be used in price resolution.\n`);
    }

    console.log('✅ Import completed successfully!');
    console.log('   Price resolver will now check special prices within active date ranges.\n');

    // Show example
    console.log('💡 Example: Price resolution priority:');
    console.log('   1. Check SpecialPrice (if today in [startDate, endDate])');
    console.log('   2. Fallback to ProductNetPrice (dealer tier pricing)');
    console.log('   3. Fallback to ProductPriceBand (if tier not assigned)\n');

  } catch (error) {
    console.error('\n❌ Import failed:', error);

    await importService.markBatchFailed(batch.id, error as Error);

    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

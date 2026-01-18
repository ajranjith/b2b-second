import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../../packages/db/.env') });
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, ImportType } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as crypto from 'crypto';
import * as fs from 'fs';
import { SupersessionImportService } from './services/SupersessionImportService';

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

interface ImportArgs {
  file: string;
}

function parseArgs(): ImportArgs {
  const args = process.argv.slice(2);
  const fileIndex = args.indexOf('--file');

  if (fileIndex === -1) {
    console.error('❌ Usage: ts-node importSupersessions.ts --file <path-to-xlsx>');
    console.error('   Example: ts-node importSupersessions.ts --file /mnt/data/Supercessions_Master_Kerridge.xlsx');
    process.exit(1);
  }

  const file = args[fileIndex + 1];

  if (!file) {
    console.error('❌ File path is required');
    process.exit(1);
  }

  return { file };
}

function calculateFileHash(filePath: string): string {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

async function main() {
  const { file } = parseArgs();

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔄 SUPERSESSION IMPORTER (with Chain Resolution)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`   File: ${file}\n`);

  // Resolve file path
  const filePath = path.isAbsolute(file) ? file : path.resolve(process.cwd(), file);

  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }

  // Calculate file hash
  const fileHash = calculateFileHash(filePath);
  console.log(`🔐 File hash: ${fileHash.substring(0, 16)}...`);

  // Create import service
  const importService = new SupersessionImportService(prisma);

  // Create import batch
  console.log('\n📝 Creating import batch...');
  const batch = await importService.createBatch(
    ImportType.SUPERSESSIONS,
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
      await prisma.stgSupersessionRow.create({
        data: {
          batchId: parsedRow.batchId,
          rowNumber: parsedRow.rowNumber,
          fromPartNo: parsedRow.fromPartNo,
          fromPartNoNormalized: parsedRow.fromPartNoNormalized,
          toPartNo: parsedRow.toPartNo,
          toPartNoNormalized: parsedRow.toPartNoNormalized,
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
      if ((i + 1) % 100 === 0) {
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

    // Process valid rows (UPSERT + Chain Resolution)
    console.log('\n🔄 Processing supersessions (UPSERT + Chain Resolution)...');
    const processedCount = await importService.processValidRows(batch.id);

    // Finish batch
    await importService.finishBatch(batch.id, {
      total: rows.length,
      valid: validCount,
      invalid: invalidCount
    });

    // Generate statistics
    console.log('\n📊 Generating statistics...');

    const totalSupersessions = await prisma.supersession.count();
    const totalResolved = await prisma.supersessionResolved.count();
    const loopsDetected = await prisma.supersessionResolved.count({
      where: { hasLoop: true }
    });

    const avgChainLength = await prisma.supersessionResolved.aggregate({
      _avg: { chainLength: true }
    });

    const maxChainLength = await prisma.supersessionResolved.aggregate({
      _max: { chainLength: true }
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
    console.log(`\nSupersession Statistics:`);
    console.log(`Raw Links:                ${totalSupersessions}`);
    console.log(`Resolved Chains:          ${totalResolved}`);
    console.log(`Loops Detected:           ${loopsDetected}`);
    console.log(`Avg Chain Length:         ${avgChainLength._avg.chainLength?.toFixed(2) || 0}`);
    console.log(`Max Chain Length:         ${maxChainLength._max.chainLength || 0}`);

    const finalBatch = await prisma.importBatch.findUnique({
      where: { id: batch.id }
    });
    console.log(`Final Status:             ${finalBatch?.status}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (invalidCount > 0) {
      console.log('⚠️  Some rows had validation errors. Check ImportError table for details.');
      console.log(`   Query: SELECT * FROM "ImportError" WHERE "batchId" = '${batch.id}';\n`);
    }

    if (loopsDetected > 0) {
      console.log('⚠️  Loop detection warning:');
      console.log(`   ${loopsDetected} parts have circular supersession chains.`);
      console.log(`   Query: SELECT * FROM "SupersessionResolved" WHERE "hasLoop" = true;`);
      console.log(`   These parts will return their original part number in search results.\n`);
    }

    console.log('✅ Import completed successfully!');
    console.log('   Search results will now show "Superseded by..." for superseded parts.\n');

    // Example usage
    console.log('💡 Example: To resolve a part number programmatically:');
    console.log('   const resolved = await supersessionService.resolvePartNumber("ABC123");\n');

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

import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

import { prisma, ImportType, ImportStatus } from "db";
import { ImportService } from "../services/ImportService";

type Args = {
  type: ImportType;
  file: string;
  startsAt?: string;
  endsAt?: string;
};

function parseArgs(): Args {
  const args = process.argv.slice(2);
  const typeIndex = args.indexOf("--type");
  const fileIndex = args.indexOf("--file");
  const startsIndex = args.indexOf("--startsAt");
  const endsIndex = args.indexOf("--endsAt");

  if (typeIndex === -1 || fileIndex === -1) {
    throw new Error(
      "Usage: tsx runImport.ts --type <ImportType> --file <path> [--startsAt YYYY-MM-DD] [--endsAt YYYY-MM-DD]",
    );
  }

  const type = args[typeIndex + 1] as ImportType;
  const file = args[fileIndex + 1];
  const startsAt = startsIndex !== -1 ? args[startsIndex + 1] : undefined;
  const endsAt = endsIndex !== -1 ? args[endsIndex + 1] : undefined;

  if (!type || !Object.values(ImportType).includes(type)) {
    throw new Error(`Invalid import type: ${type}`);
  }
  if (!file) {
    throw new Error("File path is required");
  }

  return { type, file, startsAt, endsAt };
}

async function main() {
  const { type, file, startsAt, endsAt } = parseArgs();
  const importService = new ImportService(prisma);

  const absolutePath = path.isAbsolute(file) ? file : path.resolve(process.cwd(), file);
  const fileHash = importService.calculateFileHash(absolutePath);
  const fileName = path.basename(absolutePath);

  const batch = await prisma.importBatch.create({
    data: {
      importType: type,
      fileName,
      fileHash,
      filePath: absolutePath,
      status: ImportStatus.PROCESSING,
    },
  });

  const window =
    type === ImportType.SPECIAL_PRICES
      ? {
          startsAt: new Date(startsAt as string),
          endsAt: new Date(endsAt as string),
        }
      : undefined;

  await importService.processImport(type, absolutePath, batch.id, window);

  const completed = await prisma.importBatch.findUnique({ where: { id: batch.id } });
  console.log(JSON.stringify(completed, null, 2));
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient, ImportType } from "@prisma/client";
import { ImportService, ValidationResult } from "./ImportService";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";

interface DealerAccountRow {
  "Account Number"?: string;
  "Company Name"?: string;
  "First Name"?: string;
  "Last Name"?: string;
  Email?: string;
  Status?: string;
  "Default shipping method"?: string;
  Notes?: string;
  "Genuine Tier"?: string;
  "Aftermarket ES Tier"?: string;
  "Aftermarket B Tier"?: string;
  "Temp password"?: string;
}

interface ParsedDealerRow {
  batchId: string;
  rowNumber: number;
  accountNo: string | null;
  companyName: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  status: string | null;
  defaultShippingMethod: string | null;
  shippingNotes: string | null;
  genuineTier: string | null;
  aftermarketEsTier: string | null;
  aftermarketBrTier: string | null;
  isValid: boolean;
  validationErrors: string | null;
  rawRowJson: any;
}

export class DealerImportService extends ImportService<DealerAccountRow> {
  private readonly VALID_TIERS = ["Net1", "Net2", "Net3", "Net4", "Net5", "Net6", "Net7"];
  private readonly VALID_STATUSES = ["ACTIVE", "INACTIVE", "SUSPENDED"];
  private readonly SALT_ROUNDS = 10;

  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  validateColumns(headers: string[]): { valid: boolean; missing: string[] } {
    const required = [
      "Account Number",
      "Company Name",
      "First Name",
      "Last Name",
      "Email",
      "Status",
      "Aftermarket ES Tier",
      "Aftermarket B Tier",
    ];

    const missing = required.filter((col) => !this.hasColumn(headers, col));
    const hasGenuineTier =
      this.hasColumn(headers, "Genuine Tier") || this.hasColumn(headers, "Genuine Parts Tier");
    if (!hasGenuineTier) {
      missing.push("Genuine Tier");
    }
    return { valid: missing.length === 0, missing };
  }

  validateRow(row: DealerAccountRow, rowNumber: number): ValidationResult {
    const errors: string[] = [];

    // Required: Account Number
    const error1 = this.validateRequired(row["Account Number"], "Account Number");
    if (error1) errors.push(error1);

    // Required: Company Name
    const error2 = this.validateRequired(row["Company Name"], "Company Name");
    if (error2) errors.push(error2);

    // Required: First Name
    const error3 = this.validateRequired(row["First Name"], "First Name");
    if (error3) errors.push(error3);

    // Required: Last Name
    const error4 = this.validateRequired(row["Last Name"], "Last Name");
    if (error4) errors.push(error4);

    // Required: Email (with format validation)
    const email = row["Email"]?.trim();
    if (!email) {
      errors.push("Email is required");
    } else if (!this.isValidEmail(email)) {
      errors.push("Email format is invalid");
    }

    // Required: Status (must be ACTIVE, INACTIVE, or SUSPENDED)
    const statusError = this.validateEnum(row["Status"], "Status", this.VALID_STATUSES);
    if (statusError) errors.push(statusError);

    // Required: Tier assignments (must be Net1..Net7)
    const genuineTierValue =
      this.getColumnValue(row, "Genuine Tier") ?? this.getColumnValue(row, "Genuine Parts Tier");
    const genuineTierError = this.validateEnum(genuineTierValue, "Genuine Tier", this.VALID_TIERS);
    if (genuineTierError) errors.push(genuineTierError);

    const esTierError = this.validateEnum(
      row["Aftermarket ES Tier"],
      "Aftermarket ES Tier",
      this.VALID_TIERS,
    );
    if (esTierError) errors.push(esTierError);

    const bTierError = this.validateEnum(
      row["Aftermarket B Tier"],
      "Aftermarket B Tier",
      this.VALID_TIERS,
    );
    if (bTierError) errors.push(bTierError);

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  parseRow(row: DealerAccountRow, batchId: string, rowNumber: number): ParsedDealerRow {
    const validation = this.validateRow(row, rowNumber);

    const accountNo = this.trimString(row["Account Number"]);
    const email = this.trimString(row["Email"]);

    return {
      batchId,
      rowNumber,
      accountNo,
      companyName: this.trimString(row["Company Name"]),
      firstName: this.trimString(row["First Name"]),
      lastName: this.trimString(row["Last Name"]),
      email,
      status: row["Status"]?.trim().toUpperCase() || null,
      defaultShippingMethod: this.trimString(this.getColumnValue(row, "Default shipping method")),
      shippingNotes: this.trimString(this.getColumnValue(row, "Notes")),
      genuineTier: this.trimString(
        this.getColumnValue(row, "Genuine Tier") ?? this.getColumnValue(row, "Genuine Parts Tier"),
      ),
      aftermarketEsTier: this.trimString(this.getColumnValue(row, "Aftermarket ES Tier")),
      aftermarketBrTier: this.trimString(this.getColumnValue(row, "Aftermarket B Tier")),
      isValid: validation.isValid,
      validationErrors: validation.errors.length > 0 ? validation.errors.join("; ") : null,
      rawRowJson: row as any,
    };
  }

  async processValidRows(batchId: string): Promise<number> {
    const validRows = await this.prisma.stgDealerAccountRow.findMany({
      where: { batchId, isValid: true },
    });

    let processedCount = 0;

    for (const row of validRows) {
      await this.prisma.$transaction(async (tx) => {
        // 1. UPSERT DealerAccount
        const normalizedEmail = this.normalizeEmail(row.email) ?? row.email ?? "";
        const dealerAccount = await tx.dealerAccount.upsert({
          where: { accountNo: row.accountNo! },
          update: {
            companyName: row.companyName!,
            status: row.status as any,
            notes: row.shippingNotes,
            shippingNotes: row.shippingNotes,
            mainEmail: normalizedEmail || undefined,
            defaultShippingMethod: row.defaultShippingMethod,
            updatedAt: new Date(),
          },
          create: {
            accountNo: row.accountNo!,
            companyName: row.companyName!,
            status: row.status as any,
            notes: row.shippingNotes,
            shippingNotes: row.shippingNotes,
            mainEmail: normalizedEmail || undefined,
            defaultShippingMethod: row.defaultShippingMethod,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        // 2. UPSERT AppUser (by email)
        let appUser = await tx.appUser.findUnique({
          where: { email: normalizedEmail },
        });

        // Generate or use provided temp password
        const rawRow = row.rawRowJson as Record<string, unknown> | null;
        const providedPassword = rawRow
          ? this.trimString(this.getColumnValue(rawRow, "Temp password"))
          : null;
        const tempPassword = providedPassword || this.generateTempPassword();
        const passwordHash = await bcrypt.hash(tempPassword, this.SALT_ROUNDS);

        if (!appUser) {
          // Create new AppUser
          appUser = await tx.appUser.create({
            data: {
              email: normalizedEmail,
              emailNormalized: normalizedEmail,
              passwordHash,
              role: "DEALER",
              mustChangePassword: true,
              isActive: row.status === "ACTIVE",
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });
        } else {
          // Update existing AppUser (only if creating new dealer link)
          const existingDealerUser = await tx.dealerUser.findUnique({
            where: { userId: appUser.id },
          });

          if (!existingDealerUser) {
            // Update password for new dealer assignment
            await tx.appUser.update({
              where: { id: appUser.id },
              data: {
                passwordHash,
                mustChangePassword: true,
                role: "DEALER",
                updatedAt: new Date(),
              },
            });
          }
        }

        // 3. UPSERT DealerUser (link AppUser to DealerAccount)
        await tx.dealerUser.upsert({
          where: { userId: appUser.id },
          update: {
            dealerAccountId: dealerAccount.id,
            firstName: row.firstName!,
            lastName: row.lastName!,
          },
          create: {
            userId: appUser.id,
            dealerAccountId: dealerAccount.id,
            firstName: row.firstName!,
            lastName: row.lastName!,
          },
        });

        // 4. UPSERT tier assignments (gn/es/br)
        const tierAssignments = [
          { categoryCode: "gn", netTier: row.genuineTier! },
          { categoryCode: "es", netTier: row.aftermarketEsTier! },
          { categoryCode: "br", netTier: row.aftermarketBrTier! },
        ];

        for (const assignment of tierAssignments) {
          await tx.dealerPriceTierAssignment.upsert({
            where: {
              accountNo_categoryCode: {
                accountNo: dealerAccount.accountNo,
                categoryCode: assignment.categoryCode,
              },
            },
            update: {
              netTier: assignment.netTier,
              updatedAt: new Date(),
            },
            create: {
              accountNo: dealerAccount.accountNo,
              categoryCode: assignment.categoryCode,
              netTier: assignment.netTier,
              updatedAt: new Date(),
            },
          });
          await tx.dealerDiscountTier.upsert({
            where: {
              dealerAccountId_discountCode: {
                dealerAccountId: dealerAccount.id,
                discountCode: assignment.categoryCode,
              },
            },
            update: {
              tierCode: assignment.netTier,
              updatedAt: new Date(),
            },
            create: {
              dealerAccountId: dealerAccount.id,
              discountCode: assignment.categoryCode,
              tierCode: assignment.netTier,
              updatedAt: new Date(),
            },
          });
        }

        // 5. Trigger welcome email (store temp password for email sending)
        // In production, this would send an actual email
        // For now, we'll log it or store in a queue table
        await this.logWelcomeEmail(dealerAccount.id, normalizedEmail, row.accountNo!, tempPassword);
      });

      processedCount++;
    }

    return processedCount;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private generateTempPassword(): string {
    // Generate 12-character random password with mixed case, numbers, and symbols
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";

    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, charset.length);
      password += charset[randomIndex];
    }

    return password;
  }

  private async logWelcomeEmail(
    dealerAccountId: string,
    email: string,
    accountNumber: string,
    tempPassword: string,
  ): Promise<void> {
    // In production, this would:
    // 1. Queue email in EmailQueue table
    // 2. Send via email service (SendGrid, AWS SES, etc.)
    // 3. Log in EmailLog table

    // For dev/testing, log to console
    console.log(`\n📧 Welcome Email Queued:`);
    console.log(`   To: ${email}`);
    console.log(`   Account: ${accountNumber}`);
    console.log(`   Temp Password: ${tempPassword}`);
    console.log(`   Subject: Welcome to HotBray B2B Portal\n`);

    // TODO: Implement actual email queue/send logic
    // Example:
    // await this.prisma.emailQueue.create({
    //   data: {
    //     to: email,
    //     subject: 'Welcome to HotBray B2B Portal',
    //     body: `Your account ${accountNumber} has been created. Temp password: ${tempPassword}`,
    //     status: 'PENDING'
    //   }
    // });
  }
}

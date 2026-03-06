"use client";

import { useEffect, useState } from "react";
import { useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Label,
} from "@repo/ui";
import api from "@/lib/api";

const dealerSchema = z
  .object({
    companyName: z.string().optional(),
    accountNo: z.string().min(1, "Account number is required"),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email address"),
    tempPassword: z.string().optional(),
    phone: z.string().optional(),
    entitlement: z.enum(["GENUINE_ONLY", "AFTERMARKET_ONLY", "SHOW_ALL"]),
    genuineTier: z.enum(["NET1", "NET2", "NET3", "NET4", "NET5", "NET6", "NET7"]),
    aftermarketEsTier: z.enum(["NET1", "NET2", "NET3", "NET4", "NET5", "NET6", "NET7"]),
    aftermarketBrTier: z.enum(["NET1", "NET2", "NET3", "NET4", "NET5", "NET6", "NET7"]),
    status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]),
    defaultShippingMethod: z.string().optional(),
    shippingNotes: z.string().optional(),
    billingLine1: z.string().optional(),
    billingLine2: z.string().optional(),
    billingCity: z.string().optional(),
    billingPostcode: z.string().optional(),
    billingCountry: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.defaultShippingMethod === "Others") {
        return !!data.shippingNotes && data.shippingNotes.trim().length > 0;
      }
      return true;
    },
    {
      message: "Notes are required when shipping method is Others",
      path: ["shippingNotes"],
    },
  )
  .refine(
    (data) => {
      // Validate tempPassword only has content if provided
      if (data.tempPassword && data.tempPassword.length > 0 && data.tempPassword.length < 8) {
        return false;
      }
      return true;
    },
    {
      message: "Temp password must be at least 8 characters",
      path: ["tempPassword"],
    },
  );

type DealerFormData = z.infer<typeof dealerSchema>;

interface DealerDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  dealer?: any;
}

export default function DealerDialog({ open, onClose, onSuccess, dealer }: DealerDialogProps) {
  const isEdit = !!dealer;

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<DealerFormData>({
    resolver: zodResolver(dealerSchema),
    defaultValues: {
      entitlement: "SHOW_ALL",
      status: "ACTIVE",
      genuineTier: "NET1",
      aftermarketEsTier: "NET1",
      aftermarketBrTier: "NET1",
      billingCountry: "United Kingdom",
    },
  });

  const tempPasswordValue = watch("tempPassword");
  const [copyMessage, setCopyMessage] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitStatus, setSubmitStatus] = useState<"idle" | "submitting" | "success" | "error">(
    "idle",
  );

  const handleGeneratePassword = () => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let generated = "";
    for (let i = 0; i < 12; i += 1) {
      generated += charset[Math.floor(Math.random() * charset.length)];
    }
    setValue("tempPassword", generated, { shouldValidate: true, shouldDirty: true });
    setCopyMessage("");
  };

  const handleCopyPassword = async () => {
    if (!tempPasswordValue) {
      toast.error("Generate a temp password first.");
      return;
    }
    await navigator.clipboard.writeText(tempPasswordValue);
    setCopyMessage("Copied.");
    window.setTimeout(() => setCopyMessage(""), 2000);
  };

  useEffect(() => {
    if (dealer) {
      const tierMap = (dealer.discountTiers || []).reduce((acc: any, tier: any) => {
        acc[tier.discountCode] = tier.tierCode;
        return acc;
      }, {});
      reset({
        companyName: dealer.companyName || "",
        accountNo: dealer.accountNo,
        firstName: dealer.users[0]?.firstName || "",
        lastName: dealer.users[0]?.lastName || "",
        email: dealer.users[0]?.user?.email || "",
        phone: dealer.phone || "",
        entitlement: dealer.entitlement,
        genuineTier: tierMap.gn || "NET1",
        aftermarketEsTier: tierMap.es || "NET1",
        aftermarketBrTier: tierMap.br || "NET1",
        status: dealer.status,
        defaultShippingMethod: dealer.defaultShippingMethod || undefined,
        shippingNotes: dealer.shippingNotes || "",
        billingLine1: dealer.billingLine1 || "",
        billingLine2: dealer.billingLine2 || "",
        billingCity: dealer.billingCity || "",
        billingPostcode: dealer.billingPostcode || "",
        billingCountry: dealer.billingCountry || "United Kingdom",
      });
    } else {
      reset({
        entitlement: "SHOW_ALL",
        status: "ACTIVE",
        genuineTier: "NET1",
        aftermarketEsTier: "NET1",
        aftermarketBrTier: "NET1",
        billingCountry: "United Kingdom",
      });
    }
  }, [dealer, reset]);

  const onInvalid = (formErrors: FieldErrors<DealerFormData>) => {
    const firstError = Object.values(formErrors)[0];
    const message = firstError?.message || "Please fix the highlighted fields.";
    setSubmitError(message);
    setSubmitStatus("error");
    toast.error(message);
  };

  const onSubmit = async (data: DealerFormData) => {
    try {
      setSubmitError("");
      setSubmitStatus("submitting");
      if (!isEdit && !data.tempPassword) {
        setError("tempPassword", {
          type: "manual",
          message: "Temp password is required. Use Auto-generate to create one.",
        });
        setSubmitError("Temp password is required. Use Auto-generate to create one.");
        setSubmitStatus("error");
        toast.error("Temp password is required. Use Auto-generate to create one.");
        return;
      }
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        setSubmitError("You are not logged in. Please log in again.");
        setSubmitStatus("error");
        toast.error("You are not logged in. Please log in again.");
        return;
      }
      const toastId = toast.loading(isEdit ? "Updating dealer..." : "Creating dealer...");
      const payload = {
        companyName: data.companyName || undefined,
        accountNo: data.accountNo.trim().toUpperCase(),
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email.trim(),
        tempPassword: data.tempPassword || undefined,
        phone: data.phone || undefined,
        entitlement: data.entitlement,
        status: data.status,
        defaultShippingMethod: data.defaultShippingMethod || undefined,
        shippingNotes: data.shippingNotes || undefined,
        tiers: {
          genuine: data.genuineTier,
          aftermarketEs: data.aftermarketEsTier,
          aftermarketBr: data.aftermarketBrTier,
        },
        billingAddress: {
          line1: data.billingLine1 || undefined,
          line2: data.billingLine2 || undefined,
          city: data.billingCity || undefined,
          postcode: data.billingPostcode || undefined,
          country: data.billingCountry || undefined,
        },
      };

      if (isEdit) {
        await api.patch(`/admin/dealers/${dealer.id}`, payload);
        toast.success("Dealer updated successfully", { id: toastId });
        setSubmitStatus("success");
      } else {
        const response = await api.post("/admin/dealers", payload);
        const emailSent = response.data?.emailSent !== false;
        const message = emailSent
          ? "Dealer created and active. Welcome email sent."
          : "Dealer created and active. Email failed to send.";
        toast.success(message, { id: toastId });
        setSubmitStatus("success");

        if (data.tempPassword) {
          try {
            await navigator.clipboard.writeText(data.tempPassword);
            toast.info("Temp password copied to clipboard.");
          } catch (copyError) {
            toast.info("Temp password ready to copy from the form field.");
          }
        }
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      const details = error.response?.data?.details;
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        (Array.isArray(details) && details[0]?.message) ||
        "Failed to save dealer";
      setSubmitError(message);
      setSubmitStatus("error");
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Dealer" : "Create New Dealer"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update dealer information and settings"
              : "Add a new dealer to the system. A welcome email will be sent automatically."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-8">
          {(submitError || submitStatus === "submitting") && (
            <div
              className={`rounded-md border px-4 py-3 text-sm ${
                submitStatus === "submitting"
                  ? "border-blue-200 bg-blue-50 text-blue-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {submitStatus === "submitting" ? "Submitting dealer…" : submitError}
            </div>
          )}
          {/* Section 1: Company Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Company Details</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="accountNo">
                  Account Number <span className="text-red-500">*</span>
                </Label>
                <Input id="accountNo" {...register("accountNo")} />
                {errors.accountNo && (
                  <p className="text-sm text-red-500">{errors.accountNo.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input id="companyName" {...register("companyName")} />
                {errors.companyName && (
                  <p className="text-sm text-red-500">{errors.companyName.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Contact Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">
                  First Name <span className="text-red-500">*</span>
                </Label>
                <Input id="firstName" {...register("firstName")} />
                {errors.firstName && (
                  <p className="text-sm text-red-500">{errors.firstName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">
                  Last Name <span className="text-red-500">*</span>
                </Label>
                <Input id="lastName" {...register("lastName")} />
                {errors.lastName && (
                  <p className="text-sm text-red-500">{errors.lastName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input id="email" type="email" {...register("email")} />
                {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="tempPassword">
                  {isEdit ? "Reset Password" : "Temp Password"}{" "}
                  {!isEdit && <span className="text-red-500">*</span>}
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="tempPassword"
                    type="text"
                    {...register("tempPassword")}
                    placeholder={
                      isEdit ? "Leave empty to keep current password" : "Enter temp password"
                    }
                  />
                  <Button type="button" variant="outline" onClick={handleGeneratePassword}>
                    Auto-generate
                  </Button>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <button
                    type="button"
                    className="text-blue-600 hover:text-blue-700"
                    onClick={handleCopyPassword}
                  >
                    Copy password
                  </button>
                  {copyMessage && <span>{copyMessage}</span>}
                </div>
                {isEdit && (
                  <p className="text-xs text-amber-600">
                    If a new password is set, the dealer will be required to change it on next login
                    and will receive an email notification.
                  </p>
                )}
                {errors.tempPassword && (
                  <p className="text-sm text-red-500">{errors.tempPassword.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" {...register("phone")} />
              </div>
            </div>
          </div>

          {/* Section 3: Shipping Defaults */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Default Shipping</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="defaultShippingMethod">Default Shipping Method</Label>
                <select
                  id="defaultShippingMethod"
                  {...register("defaultShippingMethod")}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md"
                >
                  <option value="">Select method</option>
                  <option value="Air">Air</option>
                  <option value="Sea">Sea</option>
                  <option value="FedEx">FedEx</option>
                  <option value="DHL">DHL</option>
                  <option value="Others">Others</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="shippingNotes">Notes (required if Others)</Label>
                <Input id="shippingNotes" {...register("shippingNotes")} />
                {errors.shippingNotes && (
                  <p className="text-sm text-red-500">{errors.shippingNotes.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section 4: Tier Assignments */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Tier Assignments</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="genuineTier">Genuine Tier (gn)</Label>
                <select
                  id="genuineTier"
                  {...register("genuineTier")}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md"
                >
                  {["NET1", "NET2", "NET3", "NET4", "NET5", "NET6", "NET7"].map((tier) => (
                    <option key={tier} value={tier}>
                      {tier}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="aftermarketEsTier">Aftermarket ES Tier (es)</Label>
                <select
                  id="aftermarketEsTier"
                  {...register("aftermarketEsTier")}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md"
                >
                  {["NET1", "NET2", "NET3", "NET4", "NET5", "NET6", "NET7"].map((tier) => (
                    <option key={tier} value={tier}>
                      {tier}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="aftermarketBrTier">Aftermarket BR Tier (br)</Label>
                <select
                  id="aftermarketBrTier"
                  {...register("aftermarketBrTier")}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md"
                >
                  {["NET1", "NET2", "NET3", "NET4", "NET5", "NET6", "NET7"].map((tier) => (
                    <option key={tier} value={tier}>
                      {tier}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 5: Entitlement */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Entitlement</h3>
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  value="GENUINE_ONLY"
                  {...register("entitlement")}
                  className="h-4 w-4 text-blue-600"
                />
                <span>Genuine Parts Only</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  value="AFTERMARKET_ONLY"
                  {...register("entitlement")}
                  className="h-4 w-4 text-blue-600"
                />
                <span>Aftermarket Parts Only</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  value="SHOW_ALL"
                  {...register("entitlement")}
                  className="h-4 w-4 text-blue-600"
                />
                <span>Show All</span>
              </label>
            </div>
          </div>

          {/* Section 7: Status */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Status</h3>
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  value="ACTIVE"
                  {...register("status")}
                  className="h-4 w-4 text-green-600"
                />
                <span className="text-green-700 font-medium">Active</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  value="INACTIVE"
                  {...register("status")}
                  className="h-4 w-4 text-slate-600"
                />
                <span className="text-slate-600">Inactive</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  value="SUSPENDED"
                  {...register("status")}
                  className="h-4 w-4 text-amber-600"
                />
                <span className="text-amber-700 font-medium">Suspended</span>
              </label>
            </div>
          </div>

          {/* Section 8: Billing Address */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Billing Address (Optional)</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="billingLine1">Address Line 1</Label>
                <Input id="billingLine1" {...register("billingLine1")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="billingLine2">Address Line 2</Label>
                <Input id="billingLine2" {...register("billingLine2")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="billingCity">City</Label>
                <Input id="billingCity" {...register("billingCity")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="billingPostcode">Postcode</Label>
                <Input id="billingPostcode" {...register("billingPostcode")} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="billingCountry">Country</Label>
                <select
                  id="billingCountry"
                  {...register("billingCountry")}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md"
                >
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Ireland">Ireland</option>
                  <option value="France">France</option>
                  <option value="Germany">Germany</option>
                  <option value="Spain">Spain</option>
                  <option value="Italy">Italy</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isSubmitting}
              onClick={() => {
                if (submitStatus === "idle") {
                  setSubmitStatus("submitting");
                }
              }}
            >
              {isSubmitting ? "Saving..." : isEdit ? "Update Dealer" : "Create Dealer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import { redirect } from "next/navigation";

export default function OrderEntryRedirect() {
  redirect("/admin/orders");
}

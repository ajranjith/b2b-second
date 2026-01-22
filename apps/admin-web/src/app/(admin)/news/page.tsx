import { redirect } from "next/navigation";

export default function NewsRedirect() {
  redirect("/admin/news");
}

import { redirect } from "next/navigation";

export default function Page() {
  // Redirect legacy/alternate URL to canonical path
  redirect("/return-and-cancellation");
}

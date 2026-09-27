import { redirect } from "next/navigation";

// The proxy sends signed-in users from /login to /dashboard.
export default function Home() {
  redirect("/login");
}

import { PageHeader } from "@/components/dashboard/PageHeader";
import { UserCard } from "@/components/dashboard/UserCard";

export default function DashboardPage() {
  return (
    <>
      <PageHeader title="Dashboard" description="You are signed in." />
      <UserCard />
    </>
  );
}

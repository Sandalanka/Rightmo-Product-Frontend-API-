import { Spinner } from "@/components/ui/Spinner";

/** Shown instantly while a dashboard page loads its data on the server. The header stays interactive. */
export default function DashboardLoading() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-brand-500">
      <Spinner size="lg" label="Loading page" />
      <p className="text-sm text-gray-500">Loading…</p>
    </div>
  );
}

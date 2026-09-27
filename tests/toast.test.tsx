import { act, render, renderHook, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import DashboardLoading from "@/app/dashboard/loading";
import { Spinner } from "@/components/ui/Spinner";
import { TOAST_DURATION_MS, ToastProvider, useToast } from "@/components/ui/Toast";

function Trigger() {
  const toast = useToast();
  return (
    <>
      <button onClick={() => toast.success("Saved!")}>success</button>
      <button onClick={() => toast.error("Could not save.")}>error</button>
    </>
  );
}

const renderToasts = () =>
  render(
    <ToastProvider>
      <Trigger />
    </ToastProvider>,
  );

describe("Toast", () => {
  afterEach(() => vi.useRealTimers());

  it("shows a success toast as a status message", async () => {
    renderToasts();
    await userEvent.click(screen.getByRole("button", { name: "success" }));
    expect(screen.getByRole("status")).toHaveTextContent("Saved!");
  });

  it("shows an error toast as an alert", async () => {
    renderToasts();
    await userEvent.click(screen.getByRole("button", { name: "error" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Could not save.");
  });

  it("closes with the dismiss button", async () => {
    renderToasts();
    await userEvent.click(screen.getByRole("button", { name: "success" }));
    await userEvent.click(screen.getByRole("button", { name: "Dismiss notification" }));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("disappears on its own after a few seconds", () => {
    vi.useFakeTimers();
    renderToasts();
    act(() => screen.getByRole("button", { name: "success" }).click());
    expect(screen.getByRole("status")).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(TOAST_DURATION_MS - 1));
    expect(screen.getByRole("status")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("stacks newest first and keeps at most three", async () => {
    const wrapper = ({ children }: { children: ReactNode }) => <ToastProvider>{children}</ToastProvider>;
    const { result } = renderHook(() => useToast(), { wrapper });

    act(() => ["one", "two", "three", "four"].forEach((m) => result.current.success(m)));

    await waitFor(() => expect(screen.getAllByRole("status").map((t) => t.textContent)).toEqual(["four", "three", "two"]));
  });

  it("throws when used outside the provider", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useToast())).toThrow(/ToastProvider/);
  });
});

describe("Spinner", () => {
  it("is hidden from screen readers without a label", () => {
    const { container } = render(<Spinner />);
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });

  it("is announced when labelled", () => {
    render(<Spinner label="Loading products" />);
    expect(screen.getByRole("status", { name: "Loading products" })).toBeInTheDocument();
  });
});

describe("Dashboard loading page", () => {
  it("shows a loading spinner", () => {
    render(<DashboardLoading />);
    expect(within(document.body).getByRole("status", { name: "Loading page" })).toBeInTheDocument();
  });
});

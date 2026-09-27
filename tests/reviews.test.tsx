import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type MockAdapter from "axios-mock-adapter";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RatingList } from "@/components/ratings/RatingList";
import { WriteReview } from "@/components/ratings/WriteReview";
import type { Rating } from "@/types/product";
import { pagination, rating, success, user } from "./fixtures";
import { resetNav } from "./utils/navigation";
import { mockApi, renderWithProviders } from "./utils/render";
import { expectToast } from "./utils/toast";

vi.mock("next/navigation", () => import("./utils/navigation"));

const me = { id: user.id, name: user.name };
const mineA = rating({ id: 1, rating: 3, comment: "First impressions", user: me });
const mineB = rating({ id: 2, rating: 5, comment: "After a month", user: me });
const theirs = rating({ id: 3, rating: 4, comment: "Great sound", user: { id: 99, name: "Someone Else" } });

describe("reviews", () => {
  let api: MockAdapter;
  let stored: Rating[];

  beforeEach(() => {
    resetNav("/dashboard/products/26");
    api = mockApi();
    stored = [mineB, theirs, mineA];
    // Behaves like the backend so lists refetch with the latest data after each change.
    api.onGet("/products/26/ratings").reply(() => [200, success({ ratings: stored, pagination: pagination(1, 1, stored.length) })]);
  });
  afterEach(() => api.restore());

  describe("WriteReview", () => {
    it("requires a star rating", async () => {
      renderWithProviders(<WriteReview productId={26} />, { user });

      await userEvent.click(screen.getByRole("button", { name: "Submit review" }));

      expect(screen.getByText("Please choose a star rating.")).toBeInTheDocument();
      expect(api.history.post).toHaveLength(0);
    });

    it("can add several reviews for the same product", async () => {
      api.onPost("/products/26/ratings").reply((config) => {
        const body = JSON.parse(config.data);
        const created = rating({ id: 100 + stored.length, rating: body.rating, comment: body.comment, user: me });
        stored = [created, ...stored];
        return [201, success(created)];
      });
      renderWithProviders(
        <>
          <WriteReview productId={26} />
          <RatingList productId={26} />
        </>,
        { user },
      );

      for (const [stars, text] of [
        [4, "Loved it"],
        [2, "Broke after a week"],
      ] as const) {
        await userEvent.click(screen.getByRole("radio", { name: new RegExp(`^${stars} star`) }));
        await userEvent.type(screen.getByLabelText("Comment"), text);
        await userEvent.click(screen.getByRole("button", { name: "Submit review" }));
        // Toasts stack, newest first.
        expect((await screen.findAllByRole("status"))[0]).toHaveTextContent("Your review was added.");
        // the form is cleared for the next review
        await waitFor(() => expect(screen.getByLabelText("Comment")).toHaveValue(""));
      }

      expect(api.history.post.map((r) => JSON.parse(r.data))).toEqual([
        { rating: 4, comment: "Loved it" },
        { rating: 2, comment: "Broke after a week" },
      ]);
      const reviews = await screen.findByRole("list", { name: "Reviews" });
      expect(await within(reviews).findByText("Broke after a week")).toBeInTheDocument();
      expect(within(reviews).getByText("Loved it")).toBeInTheDocument();
      expect(within(reviews).getAllByText("You")).toHaveLength(4);
    });
  });

  describe("RatingList", () => {
    it("shows Edit and Delete only on the user's own reviews", async () => {
      renderWithProviders(<RatingList productId={26} />, { user });

      const items = await screen.findAllByRole("listitem");
      expect(items).toHaveLength(3);
      const [b, other, a] = items;
      for (const own of [a, b]) {
        expect(within(own).getByRole("button", { name: "Edit review" })).toBeInTheDocument();
        expect(within(own).getByRole("button", { name: "Delete review" })).toBeInTheDocument();
      }
      expect(within(other).queryByRole("button", { name: "Edit review" })).not.toBeInTheDocument();
      expect(within(other).queryByRole("button", { name: "Delete review" })).not.toBeInTheDocument();
    });

    it("edits one specific review", async () => {
      api.onPut("/products/26/ratings/1").reply((config) => {
        const body = JSON.parse(config.data);
        expect(body).toEqual({ rating: 4, comment: "First impressions, updated" });
        stored = stored.map((r) => (r.id === 1 ? { ...r, ...body, updated_at: "2026-09-28T00:00:00.000000Z" } : r));
        return [200, success(stored.find((r) => r.id === 1))];
      });
      renderWithProviders(<RatingList productId={26} />, { user });

      const itemA = (await screen.findByText("First impressions")).closest("li")!;
      await userEvent.click(within(itemA).getByRole("button", { name: "Edit review" }));

      const form = screen.getByRole("listitem", { name: "Editing your review" });
      expect(within(form).getByRole("radio", { name: /^3 stars/ })).toBeChecked();
      expect(within(form).getByLabelText("Comment")).toHaveValue("First impressions");

      await userEvent.click(within(form).getByRole("radio", { name: /^4 stars/ }));
      await userEvent.type(within(form).getByLabelText("Comment"), ", updated");
      await userEvent.click(within(form).getByRole("button", { name: "Save review" }));

      const updated = (await screen.findByText("First impressions, updated")).closest("li")!;
      expect(within(updated).getByText(/edited/)).toBeInTheDocument();
      await expectToast("Your review was updated.");
      expect(screen.getByText("After a month")).toBeInTheDocument();
      expect(api.history.put).toHaveLength(1);
    });

    it("cancels an edit without saving", async () => {
      renderWithProviders(<RatingList productId={26} />, { user });

      const itemB = (await screen.findByText("After a month")).closest("li")!;
      await userEvent.click(within(itemB).getByRole("button", { name: "Edit review" }));
      await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

      expect(screen.getByText("After a month")).toBeInTheDocument();
      expect(api.history.put).toHaveLength(0);
    });

    it("deletes one specific review after confirmation", async () => {
      api.onDelete("/products/26/ratings/2").reply(() => {
        stored = stored.filter((r) => r.id !== 2);
        return [200, success(undefined, "Deleted")];
      });
      renderWithProviders(<RatingList productId={26} />, { user });

      const itemB = (await screen.findByText("After a month")).closest("li")!;
      await userEvent.click(within(itemB).getByRole("button", { name: "Delete review" }));
      await userEvent.click(within(itemB).getByRole("button", { name: "Keep it" }));
      expect(api.history.delete).toHaveLength(0);

      await userEvent.click(within(itemB).getByRole("button", { name: "Delete review" }));
      await userEvent.click(within(itemB).getByRole("button", { name: "Yes, delete" }));

      await waitFor(() => expect(screen.queryByText("After a month")).not.toBeInTheDocument());
      expect(screen.getByText("First impressions")).toBeInTheDocument();
      expect(api.history.delete[0].url).toBe("/products/26/ratings/2");
      await expectToast("Your review was deleted.");
    });

    it("shows the server error when an update is rejected", async () => {
      api.onPut("/products/26/ratings/1").reply(403, { status: "error", message: "You can only change your own ratings." });
      renderWithProviders(<RatingList productId={26} />, { user });

      const itemA = (await screen.findByText("First impressions")).closest("li")!;
      await userEvent.click(within(itemA).getByRole("button", { name: "Edit review" }));
      await userEvent.click(screen.getByRole("button", { name: "Save review" }));

      expect(await screen.findByRole("alert")).toHaveTextContent("You can only change your own ratings.");
    });
  });
});

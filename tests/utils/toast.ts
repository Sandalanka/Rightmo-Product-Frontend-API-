import { screen } from "@testing-library/react";
import { expect } from "vitest";

/** Waits for a success toast with this text. */
export async function expectToast(message: string | RegExp) {
  const text = await screen.findByText(message);
  expect(text.closest('[role="status"]')).not.toBeNull();
}

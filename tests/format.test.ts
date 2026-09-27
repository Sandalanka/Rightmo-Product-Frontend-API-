import { describe, expect, it } from "vitest";
import { formatDate, formatPrice } from "@/lib/format";

describe("formatPrice", () => {
  it.each([
    ["1999.5", "Rs. 1,999.50"],
    [0, "Rs. 0.00"],
    ["abc", "Rs. 0.00"],
  ])("%s -> %s", (input, expected) => {
    expect(formatPrice(input)).toBe(expected);
  });
});

describe("formatDate", () => {
  it("formats ISO dates and tolerates bad input", () => {
    expect(formatDate("2026-09-27T04:12:49.000000Z")).toMatch(/27 Sept? 2026/);
    expect(formatDate("nope")).toBe("");
  });
});

import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import { clearSession } from "@/lib/auth/session";

afterEach(() => {
  cleanup();
  clearSession();
});

// jsdom has no object URLs (used for image previews).
if (!URL.createObjectURL) {
  let n = 0;
  URL.createObjectURL = () => `blob:test/${++n}`;
  URL.revokeObjectURL = () => {};
}

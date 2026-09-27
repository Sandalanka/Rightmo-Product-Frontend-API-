import { describe, expect, it } from "vitest";
import { hasErrors, validateLogin, validateRegister } from "@/lib/validation/auth";

const validRegister = { name: "Jane", email: "jane@example.com", password: "Secret@123", password_confirmation: "Secret@123" };

describe("validateLogin", () => {
  it("requires email and password", () => {
    expect(validateLogin({ email: "", password: "" })).toEqual({
      email: "Email is required.",
      password: "Password is required.",
    });
  });

  it("rejects an invalid email", () => {
    expect(validateLogin({ email: "nope", password: "x" }).email).toBe("Enter a valid email address.");
  });

  it("passes valid input", () => {
    expect(hasErrors(validateLogin({ email: "jane@example.com", password: "x" }))).toBe(false);
  });
});

describe("validateRegister", () => {
  it("passes valid input", () => {
    expect(validateRegister(validRegister)).toEqual({});
  });

  it("requires a name", () => {
    expect(validateRegister({ ...validRegister, name: " " }).name).toBe("Name is required.");
  });

  it("requires at least 8 characters", () => {
    expect(validateRegister({ ...validRegister, password: "Ab1@", password_confirmation: "Ab1@" }).password).toMatch(/8 characters/);
  });

  it.each(["secret@123", "SECRET@123", "Secret@abc", "Secret1234"])("rejects weak password %s", (password) => {
    expect(validateRegister({ ...validRegister, password, password_confirmation: password }).password).toMatch(/uppercase/);
  });

  it("requires matching confirmation", () => {
    expect(validateRegister({ ...validRegister, password_confirmation: "Other@123" }).password_confirmation).toBe(
      "Password confirmation does not match.",
    );
  });
});

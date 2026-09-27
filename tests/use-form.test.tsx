import { act, renderHook } from "@testing-library/react";
import type { ChangeEvent, FormEvent } from "react";
import { describe, expect, it, vi } from "vitest";
import { useForm } from "@/hooks/useForm";
import { ApiError } from "@/lib/api";

const submitEvent = () => ({ preventDefault: vi.fn() }) as unknown as FormEvent<HTMLFormElement>;
const changeEvent = (name: string, value: string) => ({ target: { name, value } }) as ChangeEvent<HTMLInputElement>;

const setup = (onSubmit = vi.fn().mockResolvedValue(undefined)) =>
  renderHook(() =>
    useForm({
      initialValues: { email: "" },
      validate: (v) => (v.email ? {} : { email: "Email is required." }),
      onSubmit,
    }),
  );

describe("useForm", () => {
  it("updates values on change", () => {
    const { result } = setup();
    act(() => result.current.handleChange(changeEvent("email", "a@b.co")));
    expect(result.current.values.email).toBe("a@b.co");
  });

  it("blocks submit and shows client errors", async () => {
    const onSubmit = vi.fn();
    const { result } = setup(onSubmit);

    await act(() => result.current.handleSubmit(submitEvent()));

    expect(result.current.errors.email).toBe("Email is required.");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("clears a field error when that field changes", async () => {
    const { result } = setup();
    await act(() => result.current.handleSubmit(submitEvent()));
    act(() => result.current.handleChange(changeEvent("email", "a")));
    expect(result.current.errors.email).toBeUndefined();
  });

  it("maps 422 field errors from the API onto fields", async () => {
    const onSubmit = vi.fn().mockRejectedValue(new ApiError("Validation errors", 422, { email: ["Taken."] }));
    const { result } = setup(onSubmit);
    act(() => result.current.handleChange(changeEvent("email", "a@b.co")));

    await act(() => result.current.handleSubmit(submitEvent()));

    expect(result.current.errors.email).toBe("Taken.");
    expect(result.current.formError).toBe("Validation errors");
    expect(result.current.isSubmitting).toBe(false);
  });
});

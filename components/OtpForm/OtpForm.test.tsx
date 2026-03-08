import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OtpForm } from "./OtpForm";
import type { ConfirmationResult } from "firebase/auth";

const mockConfirmationResult: ConfirmationResult = {
  confirm: vi.fn().mockResolvedValue({ user: { uid: "user-1" } }),
  verificationId: "verification-id",
};

describe("OtpForm", () => {
  it("renders OTP input", () => {
    render(
      <OtpForm
        confirmationResult={mockConfirmationResult}
        onSuccess={vi.fn()}
        onBack={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("textbox", { name: /verification code/i }),
    ).toBeInTheDocument();
  });

  it("confirm button is disabled when fewer than 6 digits are entered", async () => {
    render(
      <OtpForm
        confirmationResult={mockConfirmationResult}
        onSuccess={vi.fn()}
        onBack={vi.fn()}
      />,
    );
    const input = screen.getByRole("textbox", { name: /verification code/i });
    await userEvent.type(input, "12345");
    expect(screen.getByRole("button", { name: /verify/i })).toBeDisabled();
  });

  it("confirm button is enabled when exactly 6 digits are entered", async () => {
    render(
      <OtpForm
        confirmationResult={mockConfirmationResult}
        onSuccess={vi.fn()}
        onBack={vi.fn()}
      />,
    );
    const input = screen.getByRole("textbox", { name: /verification code/i });
    await userEvent.type(input, "123456");
    expect(screen.getByRole("button", { name: /verify/i })).not.toBeDisabled();
  });

  it("calls onBack when back button is clicked", async () => {
    const onBack = vi.fn();
    render(
      <OtpForm
        confirmationResult={mockConfirmationResult}
        onSuccess={vi.fn()}
        onBack={onBack}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /back/i }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

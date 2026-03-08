import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PhoneLoginForm } from "./PhoneLoginForm";

const mockSetupRecaptcha = vi.fn();
const mockSendOtp = vi.fn();

vi.mock("@/lib/auth", () => ({
  setupRecaptcha: () => mockSetupRecaptcha(),
  sendOtp: (phone: string, verifier: unknown) => mockSendOtp(phone, verifier),
}));

describe("PhoneLoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSetupRecaptcha.mockReturnValue({
      render: vi.fn().mockResolvedValue(0),
      clear: vi.fn(),
    });
    mockSendOtp.mockResolvedValue({ confirm: vi.fn() });
  });

  it("renders phone input and submit button", () => {
    render(<PhoneLoginForm onOtpSent={vi.fn()} />);
    expect(
      screen.getByRole("textbox", { name: /phone number/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /send code/i }),
    ).toBeInTheDocument();
  });

  it("submit button is not disabled when input is empty (guarded in handler)", () => {
    render(<PhoneLoginForm onOtpSent={vi.fn()} />);
    const button = screen.getByRole("button", { name: /send code/i });
    // The button only becomes disabled during loading=true; empty input is guarded in submit handler
    expect(button).not.toBeDisabled();
  });

  it("shows loading state ('Sending…') after submit", async () => {
    // Make sendOtp never resolve so loading state persists
    let resolve: (value: unknown) => void;
    mockSendOtp.mockReturnValue(
      new Promise((res) => {
        resolve = res;
      }),
    );

    render(<PhoneLoginForm onOtpSent={vi.fn()} />);
    await userEvent.type(
      screen.getByRole("textbox", { name: /phone number/i }),
      "+15550000000",
    );
    await userEvent.click(screen.getByRole("button", { name: /send code/i }));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /sending/i }),
      ).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /sending/i })).toBeDisabled();

    // Cleanup - resolve the promise
    resolve!({ confirm: vi.fn() });
  });
});

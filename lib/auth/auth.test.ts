import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("firebase/auth", () => ({
  RecaptchaVerifier: vi.fn(function (this: object) {
    Object.assign(this, {
      render: vi.fn().mockResolvedValue(0),
      clear: vi.fn(),
    });
  }),
  signInWithPhoneNumber: vi.fn(),
  signOut: vi.fn(),
}));
vi.mock("@/lib/firebase", () => ({ auth: { currentUser: null } }));

import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signOut as firebaseSignOut,
  type ConfirmationResult,
} from "firebase/auth";

import { setupRecaptcha, sendOtp, verifyOtp, signOut } from "./auth";

const mockSignInWithPhoneNumber = vi.mocked(signInWithPhoneNumber);
const mockFirebaseSignOut = vi.mocked(firebaseSignOut);
const MockRecaptchaVerifier = vi.mocked(RecaptchaVerifier);

const makeFakeConfirmation = (): ConfirmationResult => ({
  confirm: vi.fn().mockResolvedValue({ user: { uid: "u1" } }),
  verificationId: "vid-1",
});

describe("auth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset window state between tests
    window.recaptchaVerifier =
      undefined as unknown as typeof window.recaptchaVerifier;
    window.confirmationResult =
      undefined as unknown as typeof window.confirmationResult;
  });

  describe("setupRecaptcha", () => {
    it("creates a new RecaptchaVerifier and stores it on window", () => {
      const result = setupRecaptcha("send-otp-btn");

      expect(MockRecaptchaVerifier).toHaveBeenCalledTimes(1);
      expect(window.recaptchaVerifier).toBeDefined();
      expect(result).toBe(window.recaptchaVerifier);
    });

    it("returns the existing verifier without creating a new one", () => {
      const existing = {
        render: vi.fn(),
        clear: vi.fn(),
      } as unknown as typeof window.recaptchaVerifier;
      window.recaptchaVerifier = existing;

      const result = setupRecaptcha("send-otp-btn");

      expect(MockRecaptchaVerifier).not.toHaveBeenCalled();
      expect(result).toBe(existing);
    });
  });

  describe("sendOtp", () => {
    it("calls signInWithPhoneNumber and returns the confirmation result", async () => {
      const fakeConfirmation = makeFakeConfirmation();
      mockSignInWithPhoneNumber.mockResolvedValue(fakeConfirmation);
      const fakeVerifier = {
        render: vi.fn(),
        clear: vi.fn(),
      } as unknown as InstanceType<typeof RecaptchaVerifier>;

      const result = await sendOtp("+15550000000", fakeVerifier);

      expect(mockSignInWithPhoneNumber).toHaveBeenCalledTimes(1);
      expect(result).toBe(fakeConfirmation);
    });

    it("stores the confirmation result on window.confirmationResult", async () => {
      const fakeConfirmation = makeFakeConfirmation();
      mockSignInWithPhoneNumber.mockResolvedValue(fakeConfirmation);
      const fakeVerifier = {
        render: vi.fn(),
        clear: vi.fn(),
      } as unknown as InstanceType<typeof RecaptchaVerifier>;

      await sendOtp("+15550000000", fakeVerifier);

      expect(window.confirmationResult).toBe(fakeConfirmation);
    });
  });

  describe("verifyOtp", () => {
    it("calls confirmationResult.confirm with the otp string", async () => {
      const fakeConfirmation = makeFakeConfirmation();
      await verifyOtp(fakeConfirmation, "123456");
      expect(fakeConfirmation.confirm).toHaveBeenCalledWith("123456");
    });
  });

  describe("signOut", () => {
    it("calls firebaseSignOut", async () => {
      mockFirebaseSignOut.mockResolvedValue(undefined);
      await signOut();
      expect(mockFirebaseSignOut).toHaveBeenCalledTimes(1);
    });
  });
});

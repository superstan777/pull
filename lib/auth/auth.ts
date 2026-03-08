import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier;
    confirmationResult: ConfirmationResult;
  }
}

export function setupRecaptcha(buttonId: string): RecaptchaVerifier {
  if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, buttonId, {
      size: "invisible",
      callback: () => {},
    });
  }
  return window.recaptchaVerifier;
}

export async function sendOtp(
  phoneNumber: string,
  recaptchaVerifier: RecaptchaVerifier,
): Promise<ConfirmationResult> {
  const confirmation = await signInWithPhoneNumber(
    auth,
    phoneNumber,
    recaptchaVerifier,
  );
  window.confirmationResult = confirmation;
  return confirmation;
}

export async function verifyOtp(
  confirmationResult: ConfirmationResult,
  otp: string,
) {
  return confirmationResult.confirm(otp);
}

export async function signOut() {
  await firebaseSignOut(auth);
}

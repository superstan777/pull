# auth

## Purpose

Wraps Firebase Phone Auth — reCAPTCHA setup, OTP dispatch, OTP verification, and sign-out.

## API

- `setupRecaptcha(buttonId)`: returns the invisible reCAPTCHA verifier, creating it on first call; subsequent calls return the cached instance from `window.recaptchaVerifier`
- `sendOtp(phoneNumber, verifier)`: sends SMS and returns `ConfirmationResult`; also caches it on `window.confirmationResult` for emergency recovery
- `verifyOtp(confirmationResult, otp)`: confirms the 6-digit code and resolves to a `UserCredential`
- `signOut()`: signs the current user out of Firebase Auth

## Behaviour

- `window.recaptchaVerifier` singleton prevents duplicate reCAPTCHA widgets — Firebase throws if a second verifier attaches to the same DOM element
- Callers (`PhoneLoginForm`) are responsible for clearing the verifier on error: `verifier.clear()` then null the `window` reference so the next attempt creates a fresh one
- `buttonId` must match the DOM `id` of the submit button at call time — Firebase reads the element for reCAPTCHA anchor

## Used by

- `components/PhoneLoginForm/PhoneLoginForm.tsx`
- `components/OtpForm/OtpForm.tsx`
- `app/layout.tsx` (sign-out)

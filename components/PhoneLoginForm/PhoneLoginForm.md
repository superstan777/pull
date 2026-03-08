# PhoneLoginForm

## Purpose

Step 1 of phone auth — collects an internationalised phone number and triggers Firebase OTP dispatch.

## Props / API

- `onOtpSent`: receives the `ConfirmationResult` from Firebase; parent uses it to render `OtpForm`

## Behaviour

- Recaptcha verifier is created fresh on each submit attempt using the button's DOM id (`"send-otp-btn"`) — Firebase requires this for invisible reCAPTCHA
- On error, the verifier is explicitly cleared and nulled to allow retry without stale state; `@ts-expect-error` comment on the reset line documents why the cast is necessary
- Input is `type="tel" inputMode="tel"` with `autoComplete="tel"` for SMS autofill
- Does not validate phone format locally — relies on Firebase to reject invalid numbers

## Used by

- `app/login/page.tsx`

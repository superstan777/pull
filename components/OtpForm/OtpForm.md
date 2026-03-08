# OtpForm

extends: components/PhoneLoginForm.md

## Purpose

Step 2 of phone auth — collects the 6-digit SMS code and verifies it against the Firebase `ConfirmationResult`.

## Props / API

- `confirmationResult`: the object returned by `PhoneLoginForm` after OTP dispatch
- `onSuccess`: called after successful verification (parent handles redirect)
- `onBack`: called when the user taps "← Back" to re-enter their phone number

## Delta from PhoneLoginForm

- Input strips non-digits and caps at 6 characters client-side (`.replace(/\D/g, "").slice(0, 6)`)
- Submit button is disabled until `otp.length === 6` — prevents premature submission
- `autoComplete="one-time-code"` enables iOS/Android SMS autofill
- No reCAPTCHA needed at this step

## Used by

- `app/login/page.tsx`

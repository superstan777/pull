"use client";

import { useState } from "react";
import { RecaptchaVerifier } from "firebase/auth";
import { setupRecaptcha, sendOtp } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface PhoneLoginFormProps {
  onOtpSent: (confirmation: import("firebase/auth").ConfirmationResult) => void;
}

export function PhoneLoginForm({ onOtpSent }: PhoneLoginFormProps) {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim()) return;

    setLoading(true);
    try {
      const verifier: RecaptchaVerifier = setupRecaptcha("send-otp-btn");
      const confirmation = await sendOtp(phone.trim(), verifier);
      onOtpSent(confirmation);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to send OTP";
      toast.error(message);
      // Reset recaptcha on error
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        // @ts-expect-error reset
        window.recaptchaVerifier = null;
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="phone" className="text-base">
          Phone Number
        </Label>
        <Input
          id="phone"
          type="tel"
          inputMode="tel"
          placeholder="+1 555 000 0000"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="h-12 text-lg"
          autoComplete="tel"
          required
        />
        <p className="text-sm text-muted-foreground">
          Include country code, e.g. +1 for US
        </p>
      </div>
      <Button
        id="send-otp-btn"
        type="submit"
        className="w-full h-12 text-base"
        disabled={loading}
      >
        {loading ? "Sending…" : "Send Code"}
      </Button>
    </form>
  );
}

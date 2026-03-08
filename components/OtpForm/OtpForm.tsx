"use client";

import { useState } from "react";
import { ConfirmationResult } from "firebase/auth";
import { verifyOtp } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface OtpFormProps {
  confirmationResult: ConfirmationResult;
  onSuccess: () => void;
  onBack: () => void;
}

export function OtpForm({
  confirmationResult,
  onSuccess,
  onBack,
}: OtpFormProps) {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length !== 6) return;

    setLoading(true);
    try {
      await verifyOtp(confirmationResult, otp);
      onSuccess();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Invalid code — please try again";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="otp" className="text-base">
          Verification Code
        </Label>
        <Input
          id="otp"
          type="text"
          inputMode="numeric"
          placeholder="123456"
          value={otp}
          onChange={(e) =>
            setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
          }
          className="h-12 text-lg tracking-widest text-center"
          autoComplete="one-time-code"
          maxLength={6}
          required
        />
        <p className="text-sm text-muted-foreground">
          Enter the 6-digit code sent to your phone
        </p>
      </div>
      <Button
        type="submit"
        className="w-full h-12 text-base"
        disabled={loading || otp.length !== 6}
      >
        {loading ? "Verifying…" : "Verify"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        className="w-full h-12 text-base"
        onClick={onBack}
        disabled={loading}
      >
        ← Back
      </Button>
    </form>
  );
}

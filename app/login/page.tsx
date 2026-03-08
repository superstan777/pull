"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ConfirmationResult } from "firebase/auth";
import { PhoneLoginForm } from "@/components/PhoneLoginForm";
import { OtpForm } from "@/components/OtpForm";
import { useAuth } from "@/hooks/useAuth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(
    null,
  );

  useEffect(() => {
    if (!loading && user) {
      router.replace("/");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground text-sm animate-pulse">
          Loading…
        </div>
      </div>
    );
  }

  if (user) return null;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-120">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Pull</h1>
          <p className="text-muted-foreground mt-1">Track your lifts</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {step === "phone" ? "Sign in" : "Verify your number"}
            </CardTitle>
            <CardDescription>
              {step === "phone"
                ? "We'll send you a one-time code via SMS"
                : "Enter the code we sent to your phone"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === "phone" ? (
              <PhoneLoginForm
                onOtpSent={(c) => {
                  setConfirmation(c);
                  setStep("otp");
                }}
              />
            ) : (
              <OtpForm
                confirmationResult={confirmation!}
                onSuccess={() => router.replace("/")}
                onBack={() => setStep("phone")}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

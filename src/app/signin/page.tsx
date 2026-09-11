"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Blueprint, Btn, FieldLabel, Input } from "@/components/ui";
import { useAuth } from "@/lib/AuthProvider";

export default function SignInPage() {
  const { signIn, user } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await signIn(email.trim(), password);
      router.push("/events/");
    } catch {
      setError("No account with that email and password. Check with your Main Coordinator.");
    } finally {
      setBusy(false);
    }
  }

  if (user) {
    router.push("/events/");
  }

  return (
    <div style={{ maxWidth: 1320, margin: "0 auto", padding: "clamp(20px,6vw,44px) clamp(12px,3.4vw,16px)", display: "flex", justifyContent: "center" }}>
      <Blueprint style={{ width: "min(400px,100%)", padding: 24 }}>
        <Image src="/hype-house-logo.png" alt="The Hype House" width={54} height={54} style={{ objectFit: "contain", marginBottom: 14 }} />
        <h3 style={{ margin: "0 0 4px" }}>Sign in</h3>
        <p className="text-muted" style={{ fontSize: 12.5, margin: "0 0 18px" }}>
          Use the email and password your Main Coordinator gave you.
        </p>
        <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 11 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <FieldLabel>Email</FieldLabel>
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="adwoa@hypehouse.gh" style={{ minHeight: 46 }} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <FieldLabel>Password</FieldLabel>
            <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={{ minHeight: 46 }} />
          </label>
          {error && (
            <div style={{ padding: "10px 11px", background: "var(--hh-danger-tint)", color: "var(--hh-danger-tint-ink)", fontSize: 12.5 }}>{error}</div>
          )}
          <Btn type="submit" variant="primary" disabled={busy} style={{ minHeight: 50, fontSize: 15 }}>
            {busy ? "Signing in…" : "Sign in"}
          </Btn>
        </form>
      </Blueprint>
    </div>
  );
}

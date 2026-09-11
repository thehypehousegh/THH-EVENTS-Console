"use client";

import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

/** The wireframe "blueprint" frame every card/figure/primary panel wears. */
export function Blueprint({
  children,
  className,
  style,
  as: As = "div",
  onClick,
}: {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  as?: "div" | "section";
  onClick?: () => void;
}) {
  return (
    <As className={clsx("blueprint", className)} style={{ padding: "clamp(12px,3vw,16px)", ...style }} onClick={onClick}>
      <i className="corner tl" />
      <i className="corner tr" />
      <i className="corner bl" />
      <i className="corner br" />
      {children}
    </As>
  );
}

export function Btn({
  variant = "secondary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" }) {
  return <button className={clsx("btn", `btn-${variant}`, className)} {...props} />;
}

/** A small pill toggle — used for theme/view tabs, filter chips, choice groups. */
export function Chip({
  active,
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      className={clsx("tag", className)}
      style={{
        fontFamily: "var(--font-heading)",
        fontSize: 11,
        letterSpacing: ".09em",
        textTransform: "uppercase",
        padding: "9px 12px",
        minHeight: 38,
        cursor: "pointer",
        borderRadius: "var(--radius-md)",
        border: `1px solid ${active ? "var(--color-accent-700)" : "var(--color-divider)"}`,
        background: active ? "var(--color-accent-700)" : "transparent",
        color: active ? "var(--hh-paper)" : "var(--color-text)",
      }}
      {...props}
    >
      {children}
    </button>
  );
}

export function Tag({ children, variant = "neutral", className }: { children: ReactNode; variant?: "accent" | "neutral" | "outline"; className?: string }) {
  return <span className={clsx("tag", `tag-${variant}`, className)}>{children}</span>;
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="field-label">{children}</span>;
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={clsx("input", props.className)} {...props} />;
}

export function SevPill({ severity }: { severity: string }) {
  const colors: Record<string, [string, string]> = {
    "Need a hand": ["var(--color-accent-600)", "var(--hh-paper)"],
    Attention: ["var(--hh-warn)", "var(--hh-warn-ink)"],
    Blocking: ["var(--hh-danger)", "var(--hh-danger-ink)"],
  };
  const [bg, fg] = colors[severity] || colors.Attention;
  return (
    <span
      style={{
        fontFamily: "var(--font-heading)",
        fontSize: 9.5,
        letterSpacing: ".14em",
        textTransform: "uppercase",
        padding: "3px 8px",
        background: bg,
        color: fg,
      }}
    >
      {severity}
    </span>
  );
}

export function Divider({ my = 14 }: { my?: number }) {
  return <div style={{ height: 1, background: "var(--color-divider)", margin: `${my}px 0` }} />;
}

export function Toast({ text }: { text: string }) {
  if (!text) return null;
  return (
    <div
      style={{
        position: "fixed",
        left: "50%",
        bottom: 22,
        transform: "translateX(-50%)",
        zIndex: 70,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "11px 16px",
        background: "var(--color-accent-900)",
        color: "var(--hh-paper)",
        boxShadow: "var(--shadow-lg)",
        fontSize: 13,
        maxWidth: "min(540px,92vw)",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: 9,
          letterSpacing: ".18em",
          textTransform: "uppercase",
          opacity: 0.6,
          whiteSpace: "nowrap",
        }}
      >
        Pushed live
      </span>
      <span>{text}</span>
    </div>
  );
}

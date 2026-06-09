"use client";

import { icons } from "lucide-react";

type IconProps = {
  name: string;
  size?: number;
  stroke?: number;
  className?: string;
};

/**
 * Thin wrapper so JSX can stay close to the design prototype
 * (`<Icon name="ArrowRight" size={18} />`). Defaults to lucide stroke 1.5
 * to match the handoff aesthetic. Renders nothing if the name is unknown.
 */
export function Icon({ name, size = 20, stroke = 1.5, className }: IconProps) {
  const Cmp = (icons as Record<string, React.ComponentType<{ size?: number; strokeWidth?: number; className?: string; "aria-hidden"?: boolean }>>)[name];
  if (!Cmp) return null;
  return (
    <Cmp size={size} strokeWidth={stroke} className={className} aria-hidden={true} />
  );
}

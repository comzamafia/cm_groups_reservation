"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deletePricingRule } from "@/app/admin/pricing-actions";
import { Icon } from "@/components/events/Icon";

export function DeleteRuleButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const onClick = () => {
    if (!confirm("Delete this pricing rule?")) return;
    start(async () => {
      const res = await deletePricingRule(id);
      if (!res.ok) alert(res.error || "Failed to delete");
      else router.refresh();
    });
  };
  return (
    <button type="button" className="icon-btn" onClick={onClick} disabled={pending} aria-label="Delete rule">
      <Icon name="Trash2" size={16} />
    </button>
  );
}

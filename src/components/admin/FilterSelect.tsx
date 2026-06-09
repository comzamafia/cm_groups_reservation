"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

export function FilterSelect({
  param,
  value,
  options,
  allLabel = "All",
}: {
  param: string;
  value: string;
  options: { value: string; label: string }[];
  allLabel?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = new URLSearchParams(search.toString());
    if (e.target.value) next.set(param, e.target.value);
    else next.delete(param);
    router.push(`${pathname}?${next.toString()}`);
  };

  return (
    <select value={value} onChange={onChange} aria-label={`Filter by ${param}`}>
      <option value="">{allLabel}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

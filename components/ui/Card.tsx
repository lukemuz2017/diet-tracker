import type { ComponentProps, ReactNode } from "react";

export function Card({ className = "", ...props }: ComponentProps<"section">) {
  return <section className={`rounded-card bg-paper p-5 sm:p-6 ${className}`} {...props} />;
}

export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`text-xs font-bold uppercase tracking-[0.08em] text-leaf ${className}`}>{children}</p>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 pb-6 pt-2 sm:pt-6">
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h1 className="font-display text-[40px] font-extrabold leading-none tracking-tight text-balance">
        {title}
      </h1>
      {description && <p className="max-w-[60ch] text-[17px] text-muted">{description}</p>}
    </div>
  );
}

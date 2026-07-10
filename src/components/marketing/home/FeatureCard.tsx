import type { LucideIcon } from "lucide-react";

export function FeatureCard({
  icon: Icon,
  index,
  eyebrow,
  title,
  description,
}: {
  icon: LucideIcon;
  index: string;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div
      className="home-feat-card border border-[oklch(1_0_0/11%)] p-10 md:p-[38px]"
      style={{
        background: "linear-gradient(155deg, oklch(0.166 0.024 260), oklch(0.121 0.02 263))",
      }}
    >
      <span className="home-feat-bar" />
      <span className="home-feat-sheen" />
      <span
        className="home-feat-num pointer-events-none absolute right-6 top-1.5 text-[108px] font-extralight leading-none tracking-tighter text-[oklch(1_0_0/5%)]"
        aria-hidden="true"
      >
        {index}
      </span>
      <div className="relative flex items-center gap-4">
        <div className="home-feat-icn grid h-[46px] w-[46px] shrink-0 place-items-center border border-[var(--sig)] text-[var(--sig)]">
          <Icon className="h-5 w-5" strokeWidth={2} />
        </div>
        <span className="text-[10px] font-extrabold uppercase tracking-[0.26em] text-[oklch(0.5_0.02_257)]">
          {eyebrow}
        </span>
      </div>
      <h3 className="relative mt-7 text-[17px] font-bold uppercase tracking-wide text-[oklch(0.95_0.006_247)]">
        {title}
      </h3>
      <p className="relative mt-3.5 text-sm leading-[1.85] text-[oklch(0.67_0.02_257)]">
        {description}
      </p>
      <span className="home-feat-line relative mt-6 block h-0.5 w-[26px] bg-[oklch(1_0_0/22%)]" />
    </div>
  );
}

export function CornerTicks({ size = 16 }: { size?: number }) {
  const s = `${size}px`;
  return (
    <>
      <span
        className="absolute -left-px -top-px border-l border-t border-[var(--sig)]"
        style={{ width: s, height: s }}
      />
      <span
        className="absolute -right-px -top-px border-r border-t border-[var(--sig)]"
        style={{ width: s, height: s }}
      />
      <span
        className="absolute -bottom-px -left-px border-b border-l border-[var(--sig)]"
        style={{ width: s, height: s }}
      />
      <span
        className="absolute -bottom-px -right-px border-b border-r border-[var(--sig)]"
        style={{ width: s, height: s }}
      />
    </>
  );
}

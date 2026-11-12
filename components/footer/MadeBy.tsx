// The site's credit, at the end of every footer.

export const MADE_BY = { name: "DivWebDesign", href: "https://www.divwebdesign.com" };

export function MadeBy({ className }: { className?: string }) {
  return (
    <span className={className}>
      Made by{" "}
      <a href={MADE_BY.href} target="_blank" rel="noopener">
        {MADE_BY.name}
      </a>
    </span>
  );
}

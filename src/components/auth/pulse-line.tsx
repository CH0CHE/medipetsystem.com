const EKG_PATH =
  "M0,60 L60,60 L80,60 L95,20 L115,100 L135,10 L150,60 L170,60 L190,45 L205,75 L220,60 L400,60 " +
  "L460,60 L480,60 L495,20 L515,100 L535,10 L550,60 L570,60 L590,45 L605,75 L620,60 L800,60";

export function PulseLine({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 800 120"
      fill="none"
      className={className}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d={EKG_PATH}
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="1000"
        className="animate-pulse-line"
      />
    </svg>
  );
}

import type { SVGProps } from "react";

export function ArogyaIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 2L2 22h20L12 2z" fill="currentColor" opacity="0.2" />
      <path d="M12 8l-1.5 4h3L12 8z" />
      <path d="M12 12v4" />
      <path d="M10.5 14h3" />
      <path d="M12 2L2 22" stroke="currentColor" />
      <path d="M12 2l10 20" stroke="currentColor" />
      <path d="M3.5 18h17" stroke="currentColor" />
    </svg>
  );
}

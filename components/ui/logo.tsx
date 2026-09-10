import React from "react";

export interface LogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
}

export function Logo({ size = 32, className, ...props }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path
        d="M16 4C9 4 5 9 5 16c0 6 4 11 11 12 0-9 3-14 10-17-3-4-7-7-10-7Z"
        fill="#3FA372"
      />
      <path
        d="M16 28C11 20 12 12 16 6"
        stroke="#0F4C3A"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export const FarmRiskLogo = Logo;
export default Logo;

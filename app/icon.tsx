import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
        }}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
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
      </div>
    ),
    {
      ...size,
    },
  );
}

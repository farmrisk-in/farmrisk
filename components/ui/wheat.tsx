"use client";

import React from "react";
import { motion, MotionValue, useTransform, useSpring } from "framer-motion";

interface WheatScrollWrapperProps {
  scrollProgress: MotionValue<number>;
  side: "left" | "right";
}

export function WheatScrollWrapper({
  scrollProgress,
  side,
}: WheatScrollWrapperProps) {
  // 1. Keep your original linear progress ranges
  const rawRotate = useTransform(
    scrollProgress,
    [0.0, 0.4],
    [side === "left" ? -75 : 75, 0],
  );
  const rawY = useTransform(scrollProgress, [0.0, 0.4], [100, 0]);

  const springConfig = {
    stiffness: 90, // Higher = snappier, faster snap back
    damping: 15, // Lower = more bounces, Higher = less wobble
    mass: 0.8, // Heavy weights take longer to slow down
    restDelta: 0.001,
  };

  const rotateValue = useSpring(rawRotate, springConfig);
  const yValue = useSpring(rawY, springConfig);

  return (
    <motion.div
      style={{
        rotate: rotateValue, // Uses spring dynamics now!
        y: yValue,
        transformOrigin: side === "left" ? "bottom left" : "bottom right",
      }}
      className="w-75 md:w-112.5 h-auto pointer-events-none select-none"
    >
      <svg
        width="509"
        height="914"
        viewBox="0 0 509 914"
        fill="none"
        className={`w-full h-auto ${side === "right" ? "scale-x-[-1]" : ""}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <g id="Group 3">
          <g id="Vector 1">
            <path
              d="M23.4895 766.423C34.0885 764.429 80.5976 705.996 81.5726 529.776C83.7197 509.816 93.9955 440.272 116.538 387.046C47.4307 550.04 51.5577 675.034 23.4895 766.423Z"
              className="dark:fill-taupe-700 fill-amber-600"
            />
            <path
              d="M20.6847 819.04L6.81524 815.636L139.329 620.234L193.601 605.063C184.554 615.71 161.96 637.368 143.955 638.831C125.95 640.294 54.2726 759.58 20.6847 819.04Z"
              className="dark:fill-taupe-700 fill-amber-600"
            />
            <path
              d="M152.252 605.024C178.108 548.874 214.522 539.063 171.235 460.796C143.632 535.817 124.12 529.19 152.252 605.024Z"
              className="dark:fill-taupe-700 fill-amber-600"
            />
            <path
              d="M177.384 581.783C273.067 581.372 254.784 558.503 310.324 485.743C221.259 492.374 206.352 572.35 177.384 581.783Z"
              className="dark:fill-taupe-700 fill-amber-600"
            />
            <path
              d="M223.42 514.043C223.64 464.468 271.615 444.995 220.629 368.146C210.921 426.421 169.82 453.831 223.42 514.043Z"
              className="dark:fill-taupe-700 fill-amber-600"
            />
            <path
              d="M350.119 376.033C317.644 425.963 309.536 483.712 239.716 477.604C284.137 407.58 306.43 385.529 350.119 376.033Z"
              className="dark:fill-taupe-700 fill-amber-600"
            />
            <path
              d="M268.644 408.422C273.545 339.776 296.721 342.707 250.132 281.643C236.626 362.882 230.623 366.844 268.644 408.422Z"
              className="dark:fill-taupe-700 fill-amber-600"
            />
            <path
              d="M278.888 374.174C310.299 328.578 290.282 305.284 359.392 267.103C333.559 381.343 309.361 362.353 278.888 374.174Z"
              className="dark:fill-taupe-700 fill-amber-600"
            />
            <path
              d="M295.696 305.693C296.357 258.065 302.527 232.926 264.079 202.351C273.165 251.453 240.73 260.035 295.696 305.693Z"
              className="dark:fill-taupe-700 fill-amber-600"
            />
            <path
              d="M300.983 276.662C318.832 248.876 303.953 212.138 361.874 189.592C347.422 252.217 339.928 271.516 300.983 276.662Z"
              className="dark:fill-taupe-700 fill-amber-600"
            />
            <path
              d="M307.484 227.709C304.757 197.63 314.687 178.169 270.958 140.624C276.443 208.143 271.88 204.266 307.484 227.709Z"
              className="dark:fill-taupe-700 fill-amber-600"
            />
            <path
              d="M309.533 200.64C325.655 123.72 334.387 140.568 355.08 119.914C350.478 157.385 350.525 194.638 309.533 200.64Z"
              className="dark:fill-taupe-700 fill-amber-600"
            />
            <path
              d="M311.959 160.797C300.351 129.457 313.046 111.435 271.178 91.0488C286.285 130.6 265.954 134.801 311.959 160.797Z"
              className="dark:fill-taupe-700 fill-amber-600"
            />
            <path
              d="M313.582 135.462C345.561 121.253 342.259 108.495 344.441 62.1586C326.324 75.1547 314.906 89.0317 313.582 135.462Z"
              className="dark:fill-taupe-700 fill-amber-600"
            />
            <path
              d="M304.362 105.627C303.124 69.4799 323.274 73.5065 286.465 21.276C284.645 51.1583 259.097 50.4021 304.362 105.627Z"
              className="dark:fill-taupe-700 fill-amber-600"
            />
          </g>
          <g id="Vector 2">
            <path
              d="M22.0768 820.232L13.9999 814.014L156.823 724.576L196.636 730.302C187.661 734.649 166.667 742.285 154.487 738.054C142.308 733.823 61.1389 791.076 22.0768 820.232Z"
              className="dark:fill-taupe-700 fill-amber-600"
            />
            <path
              d="M169.644 718.366C202.703 689.145 229.309 693.227 223.586 629.646C183.949 670.687 173.116 660.739 169.644 718.366Z"
              className="dark:fill-taupe-700 fill-amber-600"
            />
            <path
              d="M192.751 710.427C255.355 737.721 250.003 717.52 307.232 686.002C247.158 664.677 214.386 712.611 192.751 710.427Z"
              className="dark:fill-taupe-700 fill-amber-600"
            />
            <path
              d="M242.327 679.45C256.751 647.138 293.691 648.241 282.53 583.368C259.404 618.629 224.668 624.69 242.327 679.45Z"
              className="dark:fill-taupe-700 fill-amber-600"
            />
            <path
              d="M364.822 625.818C329.232 649.071 307.302 684.448 263.466 660.348C312.645 627.414 333.555 619.435 364.822 625.818Z"
              className="dark:fill-taupe-700 fill-amber-600"
            />
            <path
              d="M302.285 623.501C325.259 580.084 339.55 588.674 326.714 535.376C294.493 584.538 289.432 585.396 302.285 623.501Z"
              className="dark:fill-taupe-700 fill-amber-600"
            />
            <path
              d="M318.84 604.086C352.487 583.357 346.125 562.379 402.255 557.352C352.478 624.516 342.146 605.144 318.84 604.086Z"
              className="dark:fill-taupe-700 fill-amber-600"
            />
            <path
              d="M349.542 564.206C363.693 533.293 374.964 518.653 358.662 487.611C350.452 522.295 326.798 518.556 349.542 564.206Z"
              className="dark:fill-taupe-700 fill-amber-600"
            />
            <path
              d="M361.357 546.771C381.017 533.766 381.883 505.488 426.203 507.448C398.726 544.183 388.273 554.628 361.357 546.771Z"
              className="dark:fill-taupe-700 fill-amber-600"
            />
            <path
              d="M379.704 516.674C386.587 496.246 398.678 486.397 380.935 449.282C365.068 494.955 363.205 491.109 379.704 516.674Z"
              className="dark:fill-taupe-700 fill-amber-600"
            />
            <path
              d="M388.839 499.587C421.524 453.998 422.373 467.516 441.837 459.988C428.038 483.133 417.338 507.475 388.839 499.587Z"
              className="dark:fill-taupe-700 fill-amber-600"
            />
            <path
              d="M401.9 474.266C403.347 450.456 416.829 442.343 395.359 416.97C393.832 447.151 379.344 444.037 401.9 474.266Z"
              className="dark:fill-taupe-700 fill-amber-600"
            />
            <path
              d="M410.258 458.189C435.234 458.121 436.753 448.838 451.525 419.207C435.95 422.475 424.496 428.248 410.258 458.189Z"
              className="dark:fill-taupe-700 fill-amber-600"
            />
            <path
              d="M412.83 436.049C422.434 412.087 434.433 420.52 425.44 375.808C415.644 394.799 399.177 386.946 412.83 436.049Z"
              className="dark:fill-taupe-700 fill-amber-600"
            />
          </g>
        </g>
      </svg>
    </motion.div>
  );
}

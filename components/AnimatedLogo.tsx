'use client';

import React from "react";
import Image from "next/image";

export default function AnimatedLogo() {
  return (
    <div style={styles.logoContainer}>
      <Image
        src="/logo.svg"
        alt="شعار التطبيق"
        width={100}
        height={100}
        priority
        style={styles.logoImage}
      />

      {/* تعريف الأنيميشن في وسم style */}
      <style jsx>{`
        @keyframes fadeInScale {
          0% {
            opacity: 0;
            transform: scale(0.5);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}

const styles = {
  logoContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',

    animation: 'fadeInScale 1s ease-out forwards',
  },
  logoImage: {
    filter: 'drop-shadow(0px 0px 8px rgba(168, 85, 247, 0.5))',
  }
};
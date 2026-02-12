"use client";

export default function CloudLoadingSkeleton() {
  // 12 skeleton cards at randomized positions
  const skeletons = Array.from({ length: 12 }, (_, i) => {
    const x = 5 + (i % 4) * 24 + Math.sin(i * 2.3) * 5;
    const y = 10 + Math.floor(i / 4) * 30 + Math.cos(i * 1.7) * 8;
    return { x: `${x}%`, y: `${y}%`, delay: i * 0.15 };
  });

  return (
    <div className="relative flex-1 min-h-[400px]">
      {skeletons.map((pos, i) => (
        <div
          key={i}
          className="cloud-skeleton absolute w-[190px] h-[100px] rounded-[5px] bg-fred-gray-200"
          style={{
            left: pos.x,
            top: pos.y,
            animationDelay: `${pos.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

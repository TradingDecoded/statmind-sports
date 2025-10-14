// frontend/src/components/SkeletonGrid.js
export function SkeletonGrid({ count = 6 }) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
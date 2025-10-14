// frontend/src/components/EmptyState.js
export function EmptyState({ 
  title = "No predictions available", 
  message = "Check back soon for new predictions.",
  icon = "🔮"
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="text-6xl mb-6">{icon}</div>
      <h2 className="text-2xl font-bold text-white mb-3">{title}</h2>
      <p className="text-slate-400 text-center max-w-md">{message}</p>
    </div>
  );
}
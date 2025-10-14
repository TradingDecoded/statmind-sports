// frontend/src/components/LoadingState.js
export function LoadingState({ message = "Loading predictions..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
      <p className="mt-6 text-slate-400 text-lg">{message}</p>
    </div>
  );
}
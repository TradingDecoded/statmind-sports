// frontend/src/components/ErrorState.js
export function ErrorState({ 
  title = "Something went wrong", 
  message = "We couldn't load the data. Please try again.",
  onRetry 
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="text-6xl mb-6">⚠️</div>
      <h2 className="text-2xl font-bold text-white mb-3">{title}</h2>
      <p className="text-slate-400 text-center max-w-md mb-6">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
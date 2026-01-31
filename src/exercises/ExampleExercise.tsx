export default function ExampleExercise() {
  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6">
      <div className="rounded-3xl shadow-lg overflow-hidden relative bg-gradient-to-br from-sky-50 via-pink-50 to-emerald-50 border">
        <div className="p-4 md:p-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="text-4xl sm:text-5xl">🎯</div>
            <div className="flex-1 min-w-0">
              <div className="text-xl sm:text-2xl font-extrabold text-gray-900">
                EXAMPLE EXERCISE
              </div>
              <div className="text-xs sm:text-sm text-gray-700">
                This is a placeholder for a new exercise type
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-white/70 border p-6 text-center">
            <p className="text-lg">
              Add your new exercise implementation here!
            </p>
            <p className="text-sm text-gray-600 mt-2">
              This demonstrates how easy it is to add new exercises to the app.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

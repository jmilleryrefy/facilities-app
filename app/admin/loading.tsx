export default function AdminLoading() {
  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="mb-6">
        <div className="h-9 w-52 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="h-5 w-64 bg-gray-100 rounded animate-pulse" />
      </div>
      <div className="flex gap-2 mb-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-10 w-28 bg-gray-200 rounded-lg animate-pulse"
          />
        ))}
      </div>
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-lg border border-gray-200 p-6"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
                  <div className="h-5 w-16 bg-gray-200 rounded animate-pulse" />
                  <div className="h-5 w-20 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse" />
                <div className="h-4 w-48 bg-gray-100 rounded animate-pulse" />
              </div>
              <div className="h-9 w-24 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RequestDetailLoading() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6">
        <div className="h-8 w-40 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="space-y-4">
          <div className="h-7 w-56 bg-gray-200 rounded animate-pulse" />
          <div className="flex gap-2">
            <div className="h-5 w-16 bg-gray-200 rounded animate-pulse" />
            <div className="h-5 w-20 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
          <div className="h-4 w-2/3 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="h-4 w-64 bg-gray-100 rounded animate-pulse mx-auto" />
      </div>
    </div>
  );
}

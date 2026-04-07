"use client";

import Link from "next/link";
import Button from "@/components/ui/Button";

export default function RequestDetailError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Something went wrong
        </h2>
        <p className="text-gray-600 mb-6">
          We could not load this request. Please try again.
        </p>
        <div className="flex justify-center gap-4">
          <Button onClick={reset}>Try Again</Button>
          <Link href="/my-requests">
            <Button variant="secondary">Back to My Requests</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

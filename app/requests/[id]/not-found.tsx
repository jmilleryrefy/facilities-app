import Link from "next/link";
import Button from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";

export default function RequestNotFound() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <Card>
        <CardContent className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Request Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            The request you are looking for does not exist or has been removed.
          </p>
          <Link href="/my-requests">
            <Button>Back to My Requests</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

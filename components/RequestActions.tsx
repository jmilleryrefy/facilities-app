"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";

interface RequestActionsProps {
  requestId: string;
  requestStatus: string;
  isOwner: boolean;
}

export default function RequestActions({
  requestId,
  requestStatus,
  isOwner,
}: RequestActionsProps) {
  const router = useRouter();
  const [cancelling, setCancelling] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  if (!isOwner) return null;

  const canEdit = requestStatus === "PENDING";
  const canCancel = ["PENDING", "IN_PROGRESS"].includes(requestStatus);

  if (!canEdit && !canCancel) return null;

  const handleCancel = async () => {
    setCancelling(true);

    try {
      const response = await fetch(`/api/requests/${requestId}/cancel`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to cancel request");
      }

      toast.success("Request cancelled");
      router.refresh();
    } catch (error) {
      console.error("Error cancelling request:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to cancel request"
      );
    } finally {
      setCancelling(false);
      setShowConfirm(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {canEdit && (
        <Link href={`/requests/${requestId}/edit`}>
          <Button variant="secondary" size="sm">
            Edit Request
          </Button>
        </Link>
      )}

      {canCancel && (
        <>
          {showConfirm ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Cancel this request?</span>
              <Button
                variant="danger"
                size="sm"
                onClick={handleCancel}
                disabled={cancelling}
              >
                {cancelling ? "Cancelling..." : "Yes, Cancel"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowConfirm(false)}
                disabled={cancelling}
              >
                No
              </Button>
            </div>
          ) : (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowConfirm(true)}
            >
              Cancel Request
            </Button>
          )}
        </>
      )}
    </div>
  );
}

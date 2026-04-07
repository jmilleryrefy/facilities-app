"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";

interface CommentFormProps {
  requestId: string;
  requestStatus: string;
}

export default function CommentForm({
  requestId,
  requestStatus,
}: CommentFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (requestStatus === "CLOSED") {
    return (
      <p className="text-gray-500 text-sm text-center py-4">
        This request is closed. No further comments can be added.
      </p>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      toast.error("Please enter a comment");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`/api/requests/${requestId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add comment");
      }

      toast.success("Comment added");
      setMessage("");
      router.refresh();
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to add comment"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Textarea
        label="Add a Comment"
        placeholder="Add additional information or ask a question..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={3}
        required
      />
      <Button type="submit" size="sm" disabled={submitting}>
        {submitting ? "Posting..." : "Post Comment"}
      </Button>
    </form>
  );
}

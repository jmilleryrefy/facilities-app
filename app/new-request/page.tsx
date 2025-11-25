"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Severity } from "@prisma/client";

export default function NewRequestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<{
    location: string;
    description: string;
    severity: Severity;
  }>({
    location: "",
    description: "",
    severity: Severity.MEDIUM,
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create request");
      }

      toast.success("Request submitted successfully!");
      router.push("/my-requests");
    } catch (error) {
      console.error("Error creating request:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create request"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Submit New Facility Request</CardTitle>
          <p className="text-gray-600 mt-1">
            Describe the issue or request for facility maintenance or improvements
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Location"
              placeholder="e.g., Building A, 2nd Floor, Room 201"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              required
            />

            <Textarea
              label="Problem Description"
              placeholder="Describe the issue in detail..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={6}
              required
            />

            <Select
              label="Severity"
              value={formData.severity}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  severity: e.target.value as Severity,
                })
              }
              options={[
                { value: Severity.LOW, label: "Low - Cosmetic or minor issues" },
                {
                  value: Severity.MEDIUM,
                  label: "Medium - Moderate impact on operations",
                },
                {
                  value: Severity.HIGH,
                  label: "High - Significant impact on operations",
                },
                {
                  value: Severity.CRITICAL,
                  label: "Critical - Safety hazard or critical system failure",
                },
              ]}
            />

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Submitting..." : "Submit Request"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

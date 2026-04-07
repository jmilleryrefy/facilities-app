"use client";

import { useEffect, useState, FormEvent, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Severity, RequestCategory } from "@prisma/client";

export default function EditRequestPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [formData, setFormData] = useState({
    location: "",
    description: "",
    severity: Severity.MEDIUM as Severity,
    category: RequestCategory.OTHER as RequestCategory,
  });

  const fetchRequest = useCallback(async () => {
    try {
      const response = await fetch(`/api/requests/${id}`);
      if (!response.ok) {
        if (response.status === 401) {
          router.push("/login");
          return;
        }
        if (response.status === 403 || response.status === 404) {
          router.push("/my-requests");
          return;
        }
        throw new Error("Failed to fetch request");
      }

      const data = await response.json();

      // Can only edit PENDING requests
      if (data.status !== "PENDING") {
        toast.error("Only pending requests can be edited");
        router.push(`/requests/${id}`);
        return;
      }

      setFormData({
        location: data.location,
        description: data.description,
        severity: data.severity,
        category: data.category || RequestCategory.OTHER,
      });
      setCanEdit(true);
    } catch (error) {
      console.error("Error fetching request:", error);
      toast.error("Failed to load request");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchRequest();
  }, [fetchRequest]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!formData.location.trim() || !formData.description.trim()) {
      toast.error("Location and description are required");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`/api/requests/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update request");
      }

      toast.success("Request updated successfully");
      router.push(`/requests/${id}`);
    } catch (error) {
      console.error("Error updating request:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update request"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4">
        <p className="text-center text-gray-600">Loading request...</p>
      </div>
    );
  }

  if (!canEdit) {
    return null; // Will have redirected already
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="mb-6">
        <Link href={`/requests/${id}`}>
          <Button variant="ghost" size="sm">
            &larr; Back to Request
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit Request</CardTitle>
          <p className="text-gray-600 mt-1">
            Update the details of your facility request
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

            <Select
              label="Category"
              value={formData.category}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  category: e.target.value as RequestCategory,
                })
              }
              options={[
                { value: RequestCategory.PLUMBING, label: "Plumbing" },
                { value: RequestCategory.ELECTRICAL, label: "Electrical" },
                { value: RequestCategory.HVAC, label: "HVAC" },
                { value: RequestCategory.CLEANING, label: "Cleaning" },
                { value: RequestCategory.SECURITY, label: "Security" },
                { value: RequestCategory.FURNITURE, label: "Furniture" },
                { value: RequestCategory.IT_EQUIPMENT, label: "IT Equipment" },
                { value: RequestCategory.STRUCTURAL, label: "Structural" },
                { value: RequestCategory.LANDSCAPING, label: "Landscaping" },
                { value: RequestCategory.OTHER, label: "Other" },
              ]}
            />

            <div className="flex gap-4">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push(`/requests/${id}`)}
                disabled={submitting}
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

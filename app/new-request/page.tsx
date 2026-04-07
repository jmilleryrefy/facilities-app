"use client";

import { useState, useRef, FormEvent } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Severity } from "@prisma/client";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function NewRequestPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [formData, setFormData] = useState<{
    location: string;
    description: string;
    severity: Severity;
  }>({
    location: "",
    description: "",
    severity: Severity.MEDIUM,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);

    for (const file of selectedFiles) {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`"${file.name}" exceeds the 10MB size limit`);
        return;
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(
          `"${file.name}" is not a supported file type. Use JPEG, PNG, GIF, WebP, or PDF.`
        );
        return;
      }
    }

    setFiles((prev) => [...prev, ...selectedFiles]);
    // Reset the input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Create the request
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

      const newRequest = await response.json();

      // 2. Upload attachments if any
      if (files.length > 0) {
        const uploadData = new FormData();
        for (const file of files) {
          uploadData.append("files", file);
        }

        const uploadResponse = await fetch(
          `/api/requests/${newRequest.id}/attachments`,
          {
            method: "POST",
            body: uploadData,
          }
        );

        if (!uploadResponse.ok) {
          // Request was created but attachments failed
          toast.error(
            "Request created but some attachments failed to upload. You can add them later."
          );
        }
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

            {/* File Attachments */}
            <div className="w-full">
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Attachments (optional)
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Attach photos or documents. Max 10MB per file. Supported: JPEG,
                PNG, GIF, WebP, PDF.
              </p>

              <div
                className="border-2 border-dashed border-neutral-400 rounded-md p-6 text-center hover:border-primary transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <svg
                  className="mx-auto h-10 w-10 text-gray-400 mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 16v-8m0 0l-3 3m3-3l3 3M6.75 20.25h10.5A2.25 2.25 0 0019.5 18V6a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6v12a2.25 2.25 0 002.25 2.25z"
                  />
                </svg>
                <p className="text-sm text-gray-600">
                  Click to upload files or drag and drop
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={ALLOWED_TYPES.join(",")}
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {files.length > 0 && (
                <div className="mt-3 space-y-2">
                  {files.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="flex items-center justify-between bg-neutral-200 rounded-md px-3 py-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-medium text-gray-700 truncate">
                          {file.name}
                        </span>
                        <span className="text-xs text-gray-500 shrink-0">
                          ({formatFileSize(file.size)})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-error hover:text-error-dark ml-2 shrink-0"
                        aria-label={`Remove ${file.name}`}
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

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

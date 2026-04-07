"use client";

interface AttachmentInfo {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
}

interface AttachmentListProps {
  attachments: AttachmentInfo[];
  onDelete?: (id: string) => void;
  showDelete?: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImage(fileType: string): boolean {
  return fileType.startsWith("image/");
}

export default function AttachmentList({
  attachments,
  onDelete,
  showDelete = false,
}: AttachmentListProps) {
  if (attachments.length === 0) return null;

  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-gray-900 text-sm">
        Attachments ({attachments.length})
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {attachments.map((attachment) => (
          <div
            key={attachment.id}
            className="border border-neutral-300 rounded-lg overflow-hidden bg-white"
          >
            {isImage(attachment.fileType) ? (
              <a
                href={`/api/attachments/${attachment.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/attachments/${attachment.id}`}
                  alt={attachment.fileName}
                  className="w-full h-40 object-cover hover:opacity-90 transition-opacity"
                />
              </a>
            ) : (
              <a
                href={`/api/attachments/${attachment.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center h-40 bg-neutral-200 hover:bg-neutral-300 transition-colors"
              >
                <svg
                  className="h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                  />
                </svg>
              </a>
            )}
            <div className="px-3 py-2 flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">
                  {attachment.fileName}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(attachment.fileSize)}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-2">
                <a
                  href={`/api/attachments/${attachment.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-secondary-dark hover:text-secondary text-xs font-medium"
                >
                  View
                </a>
                {showDelete && onDelete && (
                  <button
                    onClick={() => onDelete(attachment.id)}
                    className="text-error hover:text-error-dark text-xs font-medium ml-2"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

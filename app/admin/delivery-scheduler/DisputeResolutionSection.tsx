import React, { useState, useCallback, memo } from "react";
import { AlertCircle, CheckCircle } from "lucide-react";

interface Order {
  id: string;
  disputeReason?: string;
  disputeCreatedAt?: string;
  disputeResolvedAt?: string;
  disputeResolution?: string;
  disputeAdminComments?: string;
}

interface DisputeResolutionSectionProps {
  order: Order;
  onResolveDispute: (
    orderId: string,
    resolution: string,
    comments: string
  ) => Promise<void>;
}

const DisputeResolutionSection = memo(
  ({ order, onResolveDispute }: DisputeResolutionSectionProps) => {
    const [comments, setComments] = useState<string>("");
    const [isResolving, setIsResolving] = useState<boolean>(false);

    const handleResolve = useCallback(
      async (resolution: string) => {
        if (!comments.trim()) {
          alert("Please add admin comments about the dispute resolution");
          return;
        }

        try {
          setIsResolving(true);
          await onResolveDispute(order.id, resolution, comments.trim());
          setComments(""); // Clear comments after successful resolution
        } catch (error) {
          console.error("Error resolving dispute:", error);
        } finally {
          setIsResolving(false);
        }
      },
      [comments, order.id, onResolveDispute]
    );

    const isDisabled = isResolving || !comments.trim();

    return (
      <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded text-sm">
        <div className="flex items-center gap-1 text-red-600 mb-2">
          <AlertCircle className="h-4 w-4" />
          <span className="font-semibold">Order Disputed</span>
        </div>

        {/* Dispute Details */}
        {order.disputeReason && (
          <div className="bg-white p-2 rounded border-l-4 border-red-400 mb-3">
            <p className="text-red-800 font-medium mb-1">Dispute Details:</p>
            <p className="text-gray-700 text-xs">{order.disputeReason}</p>
          </div>
        )}

        {order.disputeCreatedAt && (
          <p className="text-red-600 text-xs mb-3">
            Filed: {new Date(order.disputeCreatedAt).toLocaleString()}
          </p>
        )}

        {/* Show resolution if already resolved */}
        {order.disputeResolution && order.disputeResolvedAt ? (
          <div className="bg-green-50 border border-green-200 rounded p-2 mb-2">
            <div className="flex items-center gap-1 text-green-700 mb-1">
              <CheckCircle className="h-3 w-3" />
              <span className="font-medium text-xs">
                Resolved: {order.disputeResolution}
              </span>
            </div>
            <p className="text-green-600 text-xs mb-1">
              Resolved: {new Date(order.disputeResolvedAt).toLocaleString()}
            </p>
            {order.disputeAdminComments && (
              <div className="bg-white p-2 rounded border-l-2 border-green-400">
                <p className="text-green-800 font-medium text-xs mb-1">
                  Admin Comments:
                </p>
                <p className="text-gray-700 text-xs">
                  {order.disputeAdminComments}
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Resolution Actions */
          <div className="space-y-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Admin Comments (Required):
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Add your comments about the dispute resolution..."
                className="w-full text-xs border border-gray-300 rounded px-2 py-1 h-16 resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                maxLength={500}
                autoComplete="off"
                spellCheck="false"
              />
              <p className="text-xs text-gray-500 mt-1">
                {comments.length}/500 characters
              </p>
            </div>

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => handleResolve("RETURNED")}
                disabled={isDisabled}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  isDisabled
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-orange-600 text-white hover:bg-orange-700"
                }`}
              >
                {isResolving ? "Processing..." : "Mark Returned"}
              </button>

              <button
                onClick={() => handleResolve("REFUNDED")}
                disabled={isDisabled}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  isDisabled
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-red-600 text-white hover:bg-red-700"
                }`}
              >
                {isResolving ? "Processing..." : "Mark Refunded"}
              </button>

              <button
                onClick={() => handleResolve("FINALIZED")}
                disabled={isDisabled}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  isDisabled
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-green-600 text-white hover:bg-green-700"
                }`}
              >
                {isResolving ? "Processing..." : "Mark Finalized"}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
);

DisputeResolutionSection.displayName = "DisputeResolutionSection";

export default DisputeResolutionSection;

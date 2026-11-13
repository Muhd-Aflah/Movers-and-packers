import { MoveStatusTimeline } from "./MoveStatusTimeline";
import { MOVE_STATUS } from "../../constants/moveStatus";
import { Link } from "react-router-dom";

export function MyMoveCard({ move }) {
  const { _id, pickup, dropoff, moveDate, status } = move;

  return (
    <div className="rounded-lg border p-4 space-y-4">
      <div className="flex justify-between">
        <div>
          <h3 className="font-semibold">
            {pickup?.city || pickup?.address || "Pickup"} → {dropoff?.city || dropoff?.address || "Dropoff"}
          </h3>
          <p className="text-sm text-gray-500">
            {moveDate ? new Date(moveDate).toLocaleDateString() : "Date not set"}
          </p>
        </div>

        <span className="text-sm font-medium capitalize">
          {status.replace("_", " ")}
        </span>
      </div>

      <MoveStatusTimeline status={status} />

      <div className="flex gap-3">
        {status === MOVE_STATUS.REQUESTED && (
          <span className="text-sm text-gray-500">Online cancellation is unavailable</span>
        )}

        {status === MOVE_STATUS.ACCEPTED && (
          <Link
            to={`/payment?moveId=${_id}`}
            className="text-blue-600 text-sm"
          >
            Pay Now
          </Link>
        )}

        {status === MOVE_STATUS.COMPLETED && (
          <span className="text-sm text-gray-500">Reviews are not available yet</span>
        )}
      </div>
    </div>
  );
}

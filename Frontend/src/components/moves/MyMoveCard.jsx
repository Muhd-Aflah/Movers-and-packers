import { MoveStatusTimeline } from "./MoveStatusTimeline";
import { MOVE_STATUS } from "../../constants/moveStatus";
import { Link } from "react-router-dom";

export function MyMoveCard({ move }) {
  const { _id, pickup, dropoff, date, status } = move;

  return (
    <div className="rounded-lg border p-4 space-y-4">
      <div className="flex justify-between">
        <div>
          <h3 className="font-semibold">
            {pickup.city} → {dropoff.city}
          </h3>
          <p className="text-sm text-gray-500">{date}</p>
        </div>

        <span className="text-sm font-medium capitalize">
          {status.replace("_", " ")}
        </span>
      </div>

      <MoveStatusTimeline status={status} />

      <div className="flex gap-3">
        {status === MOVE_STATUS.REQUESTED && (
          <button className="text-red-600 text-sm">Cancel</button>
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
          <button className="text-green-600 text-sm">Leave Review</button>
        )}
      </div>
    </div>
  );
}

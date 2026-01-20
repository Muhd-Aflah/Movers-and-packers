import { MOVE_STATUS_ORDER, MOVE_STATUS } from "../../constants/moveStatus";

export function MoveStatusTimeline({ status }) {
  return (
    <div className="flex items-center gap-4 text-sm">
      {MOVE_STATUS_ORDER.map((step, index) => {
        const isActive =
          MOVE_STATUS_ORDER.indexOf(status) >= index &&
          status !== MOVE_STATUS.CANCELLED;

        return (
          <div key={step} className="flex items-center gap-2">
            <div
              className={`h-3 w-3 rounded-full ${
                isActive ? "bg-blue-600" : "bg-gray-300"
              }`}
            />
            <span className={isActive ? "text-blue-600" : "text-gray-400"}>
              {step.replace("_", " ")}
            </span>
            {index < MOVE_STATUS_ORDER.length - 1 && (
              <div className="h-px w-6 bg-gray-300" />
            )}
          </div>
        );
      })}
    </div>
  );
}

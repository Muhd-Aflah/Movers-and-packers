import { MOVE_STATUS_ORDER, MOVE_STATUS } from "../../constants/moveStatus";

export function MoveStatusTimeline({ status }) {
  return (
    <ol aria-label="Move progress" className="grid grid-cols-2 gap-x-3 gap-y-3 text-sm sm:flex sm:items-center sm:justify-between sm:gap-3 lg:gap-4">
      {MOVE_STATUS_ORDER.map((step, index) => {
        const isActive =
          MOVE_STATUS_ORDER.indexOf(status) >= index &&
          status !== MOVE_STATUS.CANCELLED;
        const isCurrent = status === step;

        return (
          <li key={step} className="flex min-w-0 items-center gap-2">
            <div
              aria-hidden="true"
              className={`h-3 w-3 rounded-full ${
                isActive ? "bg-blue-600" : "bg-gray-300"
              }`}
            />
            <span aria-current={isCurrent ? "step" : undefined} className={`min-w-0 break-words capitalize ${isActive ? "text-blue-600" : "text-gray-500"}`}>
              {step.replaceAll("_", " ")}
            </span>
            {index < MOVE_STATUS_ORDER.length - 1 && (
              <span aria-hidden="true" className="hidden h-px w-6 shrink-0 bg-gray-300 sm:block" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

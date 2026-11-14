import { AlertCircle, CheckCircle2, Inbox, LoaderCircle } from "lucide-react";

function StatePanel({ icon: Icon, title, description, action, tone = "neutral", role }) {
  const tones = {
    neutral: "border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200",
    error: "border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100",
    success: "border-green-200 bg-green-50 text-green-900 dark:border-green-900 dark:bg-green-950 dark:text-green-100",
  };

  return (
    <section role={role} className={`rounded-card border p-6 ${tones[tone]}`}>
      <div className="flex items-start gap-3">
        <Icon aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold">{title}</h2>
          {description && <p className="mt-1 text-sm leading-6 opacity-90">{description}</p>}
          {action && <div className="mt-4">{action}</div>}
        </div>
      </div>
    </section>
  );
}

export function LoadingSkeleton({ lines = 3, className = "" }) {
  const lineCount = Number.isInteger(lines) && lines > 0 ? Math.min(lines, 12) : 3;
  return (
    <div className={`animate-pulse space-y-3 ${className}`} role="status">
      <span className="sr-only">Loading</span>
      {Array.from({ length: lineCount }, (_, index) => (
        <div key={index} aria-hidden="true" className={`h-4 rounded bg-slate-200 dark:bg-slate-700 ${index === lineCount - 1 ? "w-2/3" : "w-full"}`} />
      ))}
    </div>
  );
}

export function EmptyState({ title, description, action }) {
  return <StatePanel icon={Inbox} title={title} description={description} action={action} role="status" />;
}

export function ErrorState({ title = "Something went wrong", description, action }) {
  return <StatePanel icon={AlertCircle} title={title} description={description} action={action} tone="error" role="alert" />;
}

export function SuccessState({ title, description, action }) {
  return <StatePanel icon={CheckCircle2} title={title} description={description} action={action} tone="success" role="status" />;
}

export function LoadingState({ title = "Loading", description }) {
  return <StatePanel icon={LoaderCircle} title={title} description={description} role="status" />;
}

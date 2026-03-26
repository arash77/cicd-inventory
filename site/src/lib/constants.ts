export const triggerColors: Record<string, string> = {
  push: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  pull_request: 'bg-blue-50 text-blue-700 border border-blue-200',
  schedule: 'bg-amber-50 text-amber-700 border border-amber-200',
  workflow_dispatch: 'bg-violet-50 text-violet-700 border border-violet-200',
  release: 'bg-rose-50 text-rose-700 border border-rose-200',
};

export const statusColors: Record<string, string> = {
  success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  failure: 'bg-rose-50 text-rose-700 border border-rose-200',
  in_progress: 'bg-blue-50 text-blue-700 border border-blue-200',
  queued: 'bg-amber-50 text-amber-700 border border-amber-200',
  cancelled: 'bg-slate-100 text-slate-600 border border-slate-200',
  skipped: 'bg-slate-50 text-slate-600 border border-slate-200',
  unknown: 'bg-gray-50 text-gray-600 border border-gray-200',
};

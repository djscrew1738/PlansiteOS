import Card from './ui/Card';

export default function BlueprintCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="relative">
        <div className="aspect-video bg-slate-800 animate-pulse" />
      </div>
      <div className="p-4">
        <div className="h-4 bg-slate-700 rounded w-3/4 animate-pulse mb-2" />
        <div className="h-3 bg-slate-700 rounded w-1/2 animate-pulse" />
        <div className="flex items-center justify-between mt-3">
          <div className="h-3 bg-slate-700 rounded w-1/4 animate-pulse" />
          <div className="h-3 bg-slate-700 rounded w-1/4 animate-pulse" />
        </div>
        <div className="flex gap-2 mt-4">
          <div className="h-8 bg-slate-700 rounded w-full animate-pulse" />
          <div className="h-8 bg-slate-700 rounded w-10 animate-pulse" />
          <div className="h-8 bg-slate-700 rounded w-10 animate-pulse" />
        </div>
      </div>
    </Card>
  );
}

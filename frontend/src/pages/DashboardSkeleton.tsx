import { Skeleton } from '../components/ui/Skeleton';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div>
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-4 w-1/2 mt-2" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-16 mt-2" />
              </div>
              <Skeleton className="h-12 w-12 rounded-lg" />
            </div>
          </Card>
        ))}
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-1/3" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 mt-4">
            <Skeleton className="h-full w-full" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-6 w-1/4" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-start space-x-3">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <div className="flex-1 min-w-0">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2 mt-2" />
                  </div>
                  <Skeleton className="h-3 w-12" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-6 w-1/3" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg">
                  <div>
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-1/4 mt-2" />
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

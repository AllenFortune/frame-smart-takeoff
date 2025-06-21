
interface LoadingStateProps {
  retryCount: number;
}

export const LoadingState = ({ retryCount }: LoadingStateProps) => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading projects...</p>
          {retryCount > 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              Retry attempt {retryCount}/{3}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};


import { Button } from "@/components/ui/button";
import { AlertTriangle, Wifi, WifiOff, RefreshCw, Plus } from "lucide-react";

interface ErrorStateProps {
  error: string;
  isOnline: boolean;
  retryCount: number;
  onRetry: () => void;
  onNewProject: () => void;
  creating: boolean;
}

export const ErrorState = ({ 
  error, 
  isOnline, 
  retryCount, 
  onRetry, 
  onNewProject, 
  creating 
}: ErrorStateProps) => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center max-w-md mx-auto">
          <div className="flex items-center justify-center mb-4">
            {isOnline ? (
              <AlertTriangle className="w-16 h-16 text-red-500" />
            ) : (
              <WifiOff className="w-16 h-16 text-red-500" />
            )}
          </div>
          
          <h3 className="text-xl font-semibold mb-2 text-red-600">
            {isOnline ? "Failed to Load Projects" : "No Internet Connection"}
          </h3>
          
          <p className="text-muted-foreground mb-4">{error}</p>
          
          {retryCount > 0 && (
            <p className="text-sm text-muted-foreground mb-4">
              Attempted {retryCount} time{retryCount !== 1 ? 's' : ''}
            </p>
          )}
          
          <div className="flex gap-4 justify-center">
            <Button onClick={onRetry} variant="outline" className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
            <Button onClick={onNewProject} disabled={creating || !isOnline}>
              <Plus className="w-4 h-4 mr-2" />
              {creating ? "Creating..." : "New Project"}
            </Button>
          </div>
          
          <div className="flex items-center justify-center mt-4 text-sm text-muted-foreground">
            {isOnline ? (
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-green-500" />
                Connected
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <WifiOff className="w-4 h-4 text-red-500" />
                Offline
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

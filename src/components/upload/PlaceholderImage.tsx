
import { FileText, AlertCircle, RefreshCcw, Image } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PlaceholderImageProps {
  pageNo: number;
  className?: string;
  error?: boolean;
  onRetry?: () => void;
}

export const PlaceholderImage = ({ 
  pageNo, 
  className = "", 
  error = false,
  onRetry 
}: PlaceholderImageProps) => {
  return (
    <div className={`flex flex-col items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 ${className}`}>
      {error ? (
        <>
          <AlertCircle className="w-8 h-8 text-red-400 mb-2" />
          <p className="text-sm text-gray-500 mb-1 text-center">Image failed to load</p>
          <p className="text-xs text-gray-400 mb-2 text-center">Check storage bucket permissions</p>
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry} className="text-xs">
              <RefreshCcw className="w-3 h-3 mr-1" />
              Retry
            </Button>
          )}
        </>
      ) : (
        <>
          <Image className="w-8 h-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-500">Page {pageNo}</p>
          <p className="text-xs text-gray-400">Processing...</p>
        </>
      )}
    </div>
  );
};

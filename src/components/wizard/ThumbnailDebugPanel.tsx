
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, RefreshCw, CheckCircle, Info } from 'lucide-react';
import { debugThumbnailGeneration, regenerateThumbnails, checkImageUrl } from '@/utils/debugThumbnails';
import { useToast } from '@/hooks/use-toast';

interface ThumbnailDebugPanelProps {
  projectId: string;
  onRefresh?: () => void;
}

export const ThumbnailDebugPanel = ({ projectId, onRefresh }: ThumbnailDebugPanelProps) => {
  const [isDebugging, setIsDebugging] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [debugResult, setDebugResult] = useState<any>(null);
  const { toast } = useToast();

  const handleDebug = async () => {
    setIsDebugging(true);
    try {
      const result = await debugThumbnailGeneration(projectId);
      setDebugResult(result);
      
      if (result.success) {
        toast({
          title: "Debug Complete",
          description: `Found ${result.pagesCount} pages. Check console for details.`
        });
      } else {
        toast({
          title: "Debug Failed",
          description: result.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Debug Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsDebugging(false);
    }
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      const result = await regenerateThumbnails(projectId);
      
      if (result.success) {
        toast({
          title: "Regeneration Complete",
          description: "Thumbnails have been regenerated. Refresh the page to see changes."
        });
        onRefresh?.();
      } else {
        toast({
          title: "Regeneration Failed", 
          description: result.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Regeneration Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="w-5 h-5" />
          Thumbnail Debug Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            onClick={handleDebug}
            disabled={isDebugging}
            variant="outline"
            size="sm"
          >
            {isDebugging ? (
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Info className="w-4 h-4 mr-2" />
            )}
            Debug Images
          </Button>
          
          <Button
            onClick={handleRegenerate}
            disabled={isRegenerating || !debugResult?.success}
            variant="default"
            size="sm"
          >
            {isRegenerating ? (
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Regenerate Thumbnails
          </Button>
        </div>

        {debugResult && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              {debugResult.success ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-500" />
              )}
              Debug Results
            </h4>
            
            {debugResult.success ? (
              <div className="space-y-2 text-sm">
                <p>Pages found: <strong>{debugResult.pagesCount}</strong></p>
                <p>PDF URL: <span className="font-mono text-xs">{debugResult.pdfUrl}</span></p>
                <div>
                  <p>Page status:</p>
                  <ul className="ml-4 mt-1">
                    {debugResult.pages?.map((page: any) => (
                      <li key={page.id} className="flex items-center gap-2">
                        Page {page.pageNo}: 
                        <span className={`px-1 text-xs rounded ${
                          Object.values(page.hasUrls).some(Boolean) 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {Object.values(page.hasUrls).filter(Boolean).length}/4 URLs
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="text-red-600 text-sm">{debugResult.error}</p>
            )}
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <p><strong>Debug:</strong> Checks PDF accessibility and current image URLs</p>
          <p><strong>Regenerate:</strong> Processes the PDF again to create new thumbnails</p>
          <p>Check the browser console for detailed logs during operations.</p>
        </div>
      </CardContent>
    </Card>
  );
};

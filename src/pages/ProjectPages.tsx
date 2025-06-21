
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppNavbar } from '@/components/AppNavbar';
import { MobileOptimizedPageGrid } from '@/components/MobileOptimizedPageGrid';
import { ProgressIndicator } from '@/components/ProgressIndicator';
import { useProjectData } from '@/hooks/useProjectData';
import { useJobPolling } from '@/hooks/useJobPolling';
import { useToast } from '@/hooks/use-toast';
import { extractSummary } from '@/utils/edgeFunctions';

const ProjectPages = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set());
  const [confidenceThreshold, setConfidenceThreshold] = useState([0.7]);
  
  const { pages, loading } = useProjectData(id!);
  const { currentJob, cancelJob, createJob } = useJobPolling({ 
    projectId: id,
    jobType: 'extract_summary'
  });

  const handlePageToggle = (pageId: string) => {
    const newSelected = new Set(selectedPages);
    if (newSelected.has(pageId)) {
      newSelected.delete(pageId);
    } else {
      newSelected.add(pageId);
    }
    setSelectedPages(newSelected);
  };

  const handleSelectAllRelevant = () => {
    const relevant = pages
      .filter(page => page.confidence >= confidenceThreshold[0])
      .map(page => page.id);
    setSelectedPages(new Set(relevant));
  };

  const handleContinue = async (selectedPageIds: string[]) => {
    if (!id) return;

    try {
      // Create a job in the database first
      const job = await createJob(id, 'extract_summary', 5);
      if (!job) {
        throw new Error('Failed to create job');
      }

      // Start the edge function
      await extractSummary(id, selectedPageIds);

      toast({
        title: "Analysis Started",
        description: "Page analysis is running in the background..."
      });

      // Navigate immediately, job polling will handle progress
      navigate(`/project/${id}/specs`);
    } catch (error) {
      console.error('Error starting summary extraction:', error);
      toast({
        title: "Error",
        description: "Failed to start page analysis. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleCancelJob = () => {
    if (currentJob) {
      cancelJob(currentJob.id);
      toast({
        title: "Job Cancelled",
        description: "Page analysis has been cancelled."
      });
    }
  };

  if (!id) {
    return <div>Project ID not found</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <main className="pb-20 sm:pb-8">
        {/* Progress Indicator */}
        {currentJob && (
          <div className="container mx-auto px-4 pt-4">
            <ProgressIndicator 
              job={currentJob}
              onCancel={handleCancelJob}
            />
          </div>
        )}

        {/* Page Grid */}
        <MobileOptimizedPageGrid
          pages={pages}
          selectedPages={selectedPages}
          confidenceThreshold={confidenceThreshold}
          loading={loading}
          onPageToggle={handlePageToggle}
          onConfidenceChange={setConfidenceThreshold}
          onSelectAllRelevant={handleSelectAllRelevant}
          onContinue={handleContinue}
        />
      </main>
    </div>
  );
};

export default ProjectPages;

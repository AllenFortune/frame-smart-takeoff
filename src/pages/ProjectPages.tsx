
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppNavbar } from '@/components/AppNavbar';
import { PageGrid } from '@/components/PageGrid';
import { useToast } from '@/hooks/use-toast';

const ProjectPages = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleContinue = async (selectedPages: string[]) => {
    if (!id) return;

    try {
      // Trigger summary extraction for selected pages
      const response = await fetch(`${process.env.SUPABASE_URL}/functions/v1/extract-summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          projectId: id,
          pageIds: selectedPages
        })
      });

      if (!response.ok) {
        throw new Error('Failed to extract summary');
      }

      toast({
        title: "Success",
        description: "Page analysis complete. Proceeding to specs..."
      });

      navigate(`/project/${id}/specs`);
    } catch (error) {
      console.error('Error extracting summary:', error);
      toast({
        title: "Error",
        description: "Failed to analyze selected pages. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (!id) {
    return <div>Project ID not found</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <main className="container mx-auto px-4 py-8">
        <PageGrid projectId={id} onContinue={handleContinue} />
      </main>
    </div>
  );
};

export default ProjectPages;

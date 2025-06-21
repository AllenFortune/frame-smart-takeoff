
import { supabase } from '@/integrations/supabase/client';

export const sendWelcomeEmail = async (userId: string, email: string, fullName: string) => {
  try {
    console.log('Sending welcome email to:', email);
    const { error } = await supabase.functions.invoke('send-welcome-email', {
      body: {
        user_id: userId,
        email: email,
        full_name: fullName
      }
    });

    if (error) {
      console.error('Error sending welcome email:', error);
      // Don't throw error - email failure shouldn't affect user experience
    } else {
      console.log('Welcome email sent successfully');
    }
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    // Don't throw error - email failure shouldn't affect user experience
  }
};

export const isNewUser = (createdAt: string): boolean => {
  const userCreatedAt = new Date(createdAt);
  const now = new Date();
  const timeDiff = now.getTime() - userCreatedAt.getTime();
  
  // If user was created within the last 30 seconds, treat as new signup
  return timeDiff < 30000;
};

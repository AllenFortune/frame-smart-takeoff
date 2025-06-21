
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Hr,
  Button,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface WelcomeEmailProps {
  userFirstName: string;
  userEmail: string;
}

export const WelcomeEmail = ({ userFirstName, userEmail }: WelcomeEmailProps) => (
  <Html>
    <Head />
    <Preview>Welcome to FING Framing Estimator - Let's get you started!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Welcome to FING Framing Estimator! 🏗️</Heading>
        
        <Text style={text}>Hi {userFirstName},</Text>
        
        <Text style={text}>
          Welcome to FING Framing Estimator! We're thrilled to have you on board. 
          Our platform is designed to help contractors like you streamline the framing 
          estimation process with AI-powered plan analysis.
        </Text>

        <Section style={buttonContainer}>
          <Button
            href="https://erfbmgcxpmtnmkffqsac.supabase.co/dashboard"
            style={button}
          >
            Get Started Now
          </Button>
        </Section>

        <Hr style={hr} />

        <Heading style={h2}>Quick Start Guide</Heading>
        
        <Text style={text}>Here's how to get the most out of FING Framing Estimator:</Text>
        
        <Section style={stepSection}>
          <Text style={stepTitle}>📋 Step 1: Upload Your Plans</Text>
          <Text style={stepText}>
            Start by uploading your construction plans in PDF format. Our AI will 
            automatically classify and organize your pages.
          </Text>
        </Section>

        <Section style={stepSection}>
          <Text style={stepTitle}>🔍 Step 2: Review Classifications</Text>
          <Text style={stepText}>
            Review how our AI has categorized your plan pages (floor plans, elevations, 
            details, etc.) and make any necessary adjustments.
          </Text>
        </Section>

        <Section style={stepSection}>
          <Text style={stepTitle}>📊 Step 3: Generate Analysis</Text>
          <Text style={stepText}>
            Use our AI wizard to extract key information and generate detailed 
            overlays for framing analysis and material estimation.
          </Text>
        </Section>

        <Section style={stepSection}>
          <Text style={stepTitle}>📈 Step 4: Export Results</Text>
          <Text style={stepText}>
            Export your analysis results, material lists, and overlays to share 
            with your team or clients.
          </Text>
        </Section>

        <Hr style={hr} />

        <Heading style={h2}>Key Features</Heading>
        
        <Text style={text}>
          • <strong>AI-Powered Plan Classification:</strong> Automatically categorize plan pages<br/>
          • <strong>Smart Material Detection:</strong> Identify framing components and materials<br/>
          • <strong>Interactive Overlays:</strong> Visual annotations and measurements<br/>
          • <strong>Detailed Reports:</strong> Comprehensive analysis and estimates<br/>
          • <strong>Project Management:</strong> Organize multiple projects efficiently
        </Text>

        <Hr style={hr} />

        <Heading style={h2}>Need Help?</Heading>
        
        <Text style={text}>
          We're here to support you every step of the way:
        </Text>
        
        <Text style={text}>
          • Check out our <Link href="#" style={link}>Getting Started Guide</Link><br/>
          • Browse our <Link href="#" style={link}>Help Documentation</Link><br/>
          • Contact our support team at <Link href="mailto:support@fingframing.com" style={link}>support@fingframing.com</Link>
        </Text>

        <Hr style={hr} />

        <Text style={footer}>
          Thanks for choosing FING Framing Estimator!<br/>
          The FING Team
        </Text>
        
        <Text style={footerSmall}>
          You're receiving this email because you signed up for FING Framing Estimator at {userEmail}.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default WelcomeEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const h1 = {
  color: '#1a1a1a',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '40px 20px 20px 20px',
  padding: '0',
  textAlign: 'center' as const,
};

const h2 = {
  color: '#1a1a1a',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '30px 20px 15px 20px',
  padding: '0',
};

const text = {
  color: '#484848',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 20px',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#007ee6',
  borderRadius: '4px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '40px 20px',
};

const stepSection = {
  margin: '20px 20px',
};

const stepTitle = {
  color: '#1a1a1a',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
  lineHeight: '24px',
};

const stepText = {
  color: '#484848',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0 0 16px 0',
};

const link = {
  color: '#007ee6',
  textDecoration: 'underline',
};

const footer = {
  color: '#1a1a1a',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '40px 20px 20px 20px',
  textAlign: 'center' as const,
};

const footerSmall = {
  color: '#9ca299',
  fontSize: '12px',
  lineHeight: '20px',
  margin: '20px 20px',
  textAlign: 'center' as const,
};

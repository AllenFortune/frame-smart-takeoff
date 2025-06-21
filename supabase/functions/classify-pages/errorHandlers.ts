
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const createErrorResponse = (
  errorCode: string, 
  message: string, 
  hint: string, 
  status: number = 400
) => {
  return new Response(
    JSON.stringify({ 
      error_code: errorCode,
      message,
      hint
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status,
    },
  );
};

export const createSuccessResponse = (data: any) => {
  return new Response(
    JSON.stringify(data),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    },
  );
};

export { corsHeaders };

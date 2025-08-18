// Node runtime with SSL bypass for SJSU certificate issues
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  // Simple internal auth - use custom header to avoid proxy issues
  if (req.headers.get('x-internal-auth') !== process.env.INTERNAL_FETCH_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // Try direct connection first, fallback to proxy for SSL issues
    let response;
    const directUrl = 'https://sjsuparkingstatus.sjsu.edu/GarageStatusPlain';
    
    try {
      // Node.js runtime: Try direct fetch with SSL bypass for problematic certificates
      // Set environment variable to bypass SSL verification for this specific request
      const originalRejectUnauthorized = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // Bypass SSL verification
      
      try {
        response = await fetch(directUrl, { 
          method: 'GET',
          cache: 'no-store',
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; SJSU-Parking-Scraper/1.0)',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          }
        });
      } finally {
        // Restore original SSL verification setting
        if (originalRejectUnauthorized !== undefined) {
          process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalRejectUnauthorized;
        } else {
          delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
        }
      }
    } catch (sslError) {
      console.error('Direct fetch failed:', sslError instanceof Error ? sslError.message : sslError);
      
      // The SSL certificate issue is likely due to intermediate chain problems
      // Edge runtime might be more strict than regular Node.js
      const errorDetails = sslError instanceof Error ? sslError.message : String(sslError);
      
      throw new Error(`SSL Certificate Error: ${errorDetails}. This appears to be an issue with SJSU's SSL certificate configuration.`);
    }
    
    if (!response.ok) {
      console.error('SJSU upstream error:', response.status, response.statusText);
      return new Response(`SJSU upstream failed: ${response.status} ${response.statusText}`, { status: 502 });
    }
    
    const text = await response.text();
    
    return new Response(text, { 
      headers: { 
        'content-type': 'text/plain; charset=utf-8',
        'cache-control': 'no-cache, no-store, must-revalidate'
      } 
    });
    
  } catch (error) {
    console.error('Edge fetcher error:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      cause: error instanceof Error ? error.cause : undefined
    });
    return new Response(`Failed to fetch SJSU data: ${error instanceof Error ? error.message : 'Unknown error'}`, { status: 500 });
  }
}

// Allow POST for cron/webhooks
export const POST = GET;

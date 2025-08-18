// Edge runtime is more tolerant of SSL certificate issues
export const runtime = 'edge';
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
      response = await fetch(directUrl, { 
        cache: 'no-store',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        }
      });
    } catch (sslError) {
      console.log('Direct fetch failed, trying CORS proxy:', sslError.message);
      // Use CORS proxy as fallback for SSL certificate issues
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(directUrl)}`;
      response = await fetch(proxyUrl, { 
        cache: 'no-store',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
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
      name: error?.name,
      message: error?.message,
      cause: error?.cause
    });
    return new Response(`Failed to fetch SJSU data: ${error?.message || 'Unknown error'}`, { status: 500 });
  }
}

// Allow POST for cron/webhooks
export const POST = GET;

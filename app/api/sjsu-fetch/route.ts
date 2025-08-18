// Edge runtime is more tolerant of SSL certificate issues
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  // Simple internal auth - use custom header to avoid proxy issues
  if (req.headers.get('x-internal-auth') !== process.env.INTERNAL_FETCH_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const upstream = 'https://sjsuparkingstatus.sjsu.edu/GarageStatusPlain';
    
    const response = await fetch(upstream, { 
      cache: 'no-store',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    });
    
    if (!response.ok) {
      return new Response('SJSU upstream failed', { status: 502 });
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
    return new Response('Failed to fetch SJSU data', { status: 500 });
  }
}

// Allow POST for cron/webhooks
export const POST = GET;

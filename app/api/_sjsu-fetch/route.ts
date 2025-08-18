// Edge runtime is more tolerant of SSL certificate issues
export const runtime = 'edge';

export async function GET() {
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
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'no-cache, no-store, must-revalidate'
      } 
    });
    
  } catch (error) {
    console.error('Edge fetcher error:', error);
    return new Response('Failed to fetch SJSU data', { status: 500 });
  }
}

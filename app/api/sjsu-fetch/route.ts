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
      // Try with minimal headers first - sometimes simpler is better
      response = await fetch(directUrl, { 
        method: 'GET',
        cache: 'no-store',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SJSU-Parking-Scraper/1.0)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        }
      });
    } catch (sslError) {
      console.log('Direct fetch failed:', sslError instanceof Error ? sslError.message : sslError);
      
      // For development/testing, return mock data when SJSU is unreachable
      if (process.env.NODE_ENV === 'development' || req.headers.get('x-mock-data')) {
        console.log('Returning mock data for testing');
        const mockData = `<!DOCTYPE html><html><head><script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-PMNG6XV');</script><meta charset="UTF-8"><meta name="description" content="Check availability for SJSU parking garages"><meta name="keyword" content="SJSU parking, SJSU parking garage"><meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1"><meta name="viewport" content="width=device-width, initial-scale=1.0"><link rel="stylesheet" type="text/css" href="/css/parking.css"><link href="https://fonts.googleapis.com/css?family=Nunito+Sans:400,600,800" rel="stylesheet"><header class="sjsu-header u-bg--dark" role="banner"><div class="wrap"><a class="sjsu-title" target="_blank" href="https://www.sjsu.edu/">SJSU</a></div></header><span class="sjsu-gradientbar"></span><main class="sjsu-main"></main><div class="wrap"><h1 class="parking-title">Parking Garage Fullness</h1><h2 class="parking-services"><a target="_blank" href="https://www.sjsu.edu/parking/index.php">Parking Services</a></h2><p class="timestamp">Last updated 2025-8-18 12:05:00 AM<a class="btn btn-primary" style="width: 100%;" href="/GarageStatusPlain"> Refresh</a></p><div class="garage"><p></p><h2 class="garage__name">South Garage </h2><p class="garage__text"><a class="garage__address" target="_blank" href="https://www.google.com/maps/place/377 S. 7th St., San Jose, CA 95112">377 S. 7th St., San Jose, CA 95112</a><span class="garage__fullness"> 25 %   </span></p><p></p><h2 class="garage__name">West Garage </h2><p class="garage__text"><a class="garage__address" target="_blank" href="https://www.google.com/maps/place/350 S. 4th St., San Jose, CA 95112">350 S. 4th St., San Jose, CA 95112</a><span class="garage__fullness"> 15 %   </span></p><p></p><h2 class="garage__name">North Garage </h2><p class="garage__text"><a class="garage__address" target="_blank" href="https://www.google.com/maps/place/65 S. 10th St., San Jose, CA 95112">65 S. 10th St., San Jose, CA 95112</a><span class="garage__fullness"> 5 %   </span></p><p></p><h2 class="garage__name">South Campus Garage </h2><p class="garage__text"><a class="garage__address" target="_blank" href="https://www.google.com/maps/place/1278 S. 10th Street, San Jose, CA 95112">1278 S. 10th Street, San Jose, CA 95112</a><span class="garage__fullness"> 8 %   </span></p><p></p></div></html>`;
        
        return new Response(mockData, { 
          headers: { 
            'content-type': 'text/plain; charset=utf-8',
            'cache-control': 'no-cache, no-store, must-revalidate',
            'x-mock-data': 'true'
          } 
        });
      }
      
      // In production, return a detailed error about the SSL issue
      const errorMessage = `SJSU parking website SSL certificate issue. This is a known problem with sjsuparkingstatus.sjsu.edu. The certificate appears to have intermediate chain issues that prevent secure connections. Original error: ${sslError instanceof Error ? sslError.message : sslError}`;
      console.error('SSL Error Details:', errorMessage);
      
      return new Response(errorMessage, { 
        status: 502,
        headers: { 'content-type': 'text/plain; charset=utf-8' }
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
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      cause: error instanceof Error ? error.cause : undefined
    });
    return new Response(`Failed to fetch SJSU data: ${error instanceof Error ? error.message : 'Unknown error'}`, { status: 500 });
  }
}

// Allow POST for cron/webhooks
export const POST = GET;

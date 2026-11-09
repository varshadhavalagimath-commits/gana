import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title');
    const artist = searchParams.get('artist');

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Append "lyrics" to query for clean music track matching (bypasses official label embed restrictions)
    const query = encodeURIComponent(`${title} ${artist || ''} lyrics`);
    const searchUrl = `https://www.youtube.com/results?search_query=${query}`;

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    const html = await response.text();
    
    // Parse the first videoId key inside YouTube's page json metadata
    const match = html.match(/"videoId":"([^"]+)"/);
    const videoId = match ? match[1] : null;

    if (!match || !videoId) {
      return NextResponse.json({ error: 'Failed to extract video stream source' }, { status: 404 });
    }

    // Extract authentic song duration matching the original audio track length
    let duration: number | null = null;
    const idx = html.indexOf(match[0]);
    const snippet = html.substring(idx, idx + 3500);

    const lengthTextMatch = snippet.match(/"lengthText":\{[^}]*"simpleText":"(?:(\d+):)?(\d+):(\d+)"/);
    if (lengthTextMatch) {
      const hours = parseInt(lengthTextMatch[1] || '0', 10);
      const minutes = parseInt(lengthTextMatch[2] || '0', 10);
      const seconds = parseInt(lengthTextMatch[3] || '0', 10);
      duration = hours * 3600 + minutes * 60 + seconds;
    } else {
      const durLabelMatch = snippet.match(/"label":"(?:[^"]*?\s)?(?:(\d+)\s*hours?,\s*)?(?:(\d+)\s*minutes?,\s*)?(\d+)\s*seconds?"/);
      if (durLabelMatch) {
        const hours = parseInt(durLabelMatch[1] || '0', 10);
        const minutes = parseInt(durLabelMatch[2] || '0', 10);
        const seconds = parseInt(durLabelMatch[3] || '0', 10);
        duration = hours * 3600 + minutes * 60 + seconds;
      }
    }

    return NextResponse.json({ videoId, duration }, { status: 200 });
  } catch (error) {
    console.error('YouTube Search Scraper Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

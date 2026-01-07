import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    console.log(`Fetching Snapchat profile HTML: ${username}`);

    // Fetch de la page HTML Snapchat
    const url = `https://www.snapchat.com/@${username}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Snapchat page: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extraire le nom d'affichage
    const displayName = $('h1').first().text().trim() || username;

    // Extraire les spotlights avec regex depuis le texte HTML
    const spotlightMatches = html.matchAll(/\[(\d+k?)\s*(?:\n|\s)*(\d+)\s*(?:\n|\s)*(\d+)?\]/gi);
    const spotlights: any[] = [];

    for (const match of spotlightMatches) {
      const views = match[1]; // "12k", "6k", etc.
      const likes = match[2];
      const comments = match[3] || '0';
      
      spotlights.push({
        views,
        likes,
        comments
      });
    }

    // Détecter si le compte a des stories (cercle bleu)
    const hasPublicStories = html.includes('Stories') && html.includes('Spotlight');

    console.log(`Found ${spotlights.length} spotlights`);

    return NextResponse.json({
      username,
      displayName,
      accountType: spotlights.length > 0 ? 'mixed_public' : 'private',
      isPrivate: false,
      stats: {
        stories: hasPublicStories ? 1 : 0,
        highlights: 0,
        spotlights: spotlights.length,
        lenses: 0
      },
      spotlightDetails: spotlights
    });

  } catch (error: any) {
    console.error('Error scraping Snapchat:', error);
    return NextResponse.json(
      { error: 'Failed to scrape Snapchat data', details: error.message },
      { status: 500 }
    );
  }
}

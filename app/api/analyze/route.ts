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

    // Extraire le JSON __NEXT_DATA__
    const nextDataScript = $('#__NEXT_DATA__').html();
    if (!nextDataScript) {
      throw new Error('Could not find __NEXT_DATA__ in HTML');
    }

    const nextData = JSON.parse(nextDataScript);
    const profileData = nextData?.props?.pageProps?.userProfile?.userInfo;

    if (!profileData) {
      throw new Error('Could not extract profile data from __NEXT_DATA__');
    }

    // Extraire les informations basiques
    const displayName = profileData.displayName || username;
    const pageType = profileData.pageType || 0;

    // Déterminer le type de compte
    let accountType = 'private';
    if (pageType === 18) {
      accountType = 'public_profile';
    } else if (pageType === 19 || pageType === 20) {
      accountType = 'mixed_public';
    }

    // Extraire les stories publiques
    const publicStories = nextData?.props?.pageProps?.story?.snapList || [];
    const storiesCount = publicStories.length;
    
    // Créer les liens vers les stories
    const storyLinks = publicStories.map((story: any) => ({
      id: story.snapId?.value || '',
      url: `https://www.snapchat.com/@${username}/${story.snapId?.value || ''}`,
      timestamp: story.timestampInSec?.value || 0
    }));

    // Extraire les spotlights
    const spotlightsData = nextData?.props?.pageProps?.spotlights || [];
    const spotlightsCount = spotlightsData.length;

    // Extraire les highlights
    const highlightsData = nextData?.props?.pageProps?.highlights || [];
    const highlightsCount = highlightsData.length;

    // Extraire subscriber count si disponible
    const subscriberCount = profileData.subscriberCount?.value || 0;

    // Retourner les données
    return NextResponse.json({
      username,
      displayName,
      accountType,
      pageType,
      publicStoriesCount: storiesCount,
      publicStories: storyLinks,
      spotlightsCount,
      highlightsCount,
      subscriberCount,
      lensesCount: 0, // Pas d'info sur les lenses dans __NEXT_DATA__
      success: true
    });

  } catch (error: any) {
    console.error('Error analyzing Snapchat profile:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred' },
      { status: 500 }
    );
  }
}

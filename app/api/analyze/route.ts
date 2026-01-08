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

    const scriptContent = $('script#__NEXT_DATA__').html();
    
    if (!scriptContent) {
      throw new Error('Could not find __NEXT_DATA__ in HTML');
    }

    const nextData = JSON.parse(scriptContent);
    const pageProps = nextData?.props?.pageProps;
    const props = pageProps?.userProfile?.publicProfileInfo;

    if (!props) {
      throw new Error('Could not extract profile data from __NEXT_DATA__');
    }

    // Extraire les Spotlights depuis les highlights
    const highlights = pageProps?.userProfile?.spotlightHighlights || [];
    const spotlightCount = highlights.length || 0;

    // Détecter les Stories publiques
    const hasStory = pageProps?.story ? true : false;
    const storyCount = hasStory ? 1 : 0;

    // Déterminer le type de compte
    let accountType = 'Privé';
    const pageType = props.pageType;
    const hasPublicContent = props.snapcodeImageUrl || props.profilePictureUrl;
    const subscriberCount = props.subscriberCount || 0;

    if (pageType === 18) {
      accountType = 'Public';
    } else if (hasPublicContent || spotlightCount > 0 || subscriberCount > 0 || hasStory) {
      accountType = 'Mixte (Public partiel)';
    }

    const result = {
      username: props.username || username,
      displayName: props.displayName || props.username || username,
      bio: props.bio || '',
      snapcodeUrl: props.snapcodeImageUrl || '',
      profilePictureUrl: props.profilePictureUrl || '',
      subscriberCount: subscriberCount,
      totalSpotlightCount: spotlightCount,
      accountType: accountType,
      hasPublicStories: hasStory,
      publicStoriesUrl: `https://www.snapchat.com/@${username}`,
      pageType: pageType,
      stats: {
        stories: storyCount,
        highlights: 0,
        spotlights: spotlightCount,
        lenses: 0
      }
    };

    console.log('Extracted profile data:', result);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error analyzing Snapchat profile:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze profile' },
      { status: 500 }
    );
  }
}

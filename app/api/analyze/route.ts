import { NextRequest, NextResponse } from 'next/server';
// Real Snapchat data fetching implementation

// Fonction pour extraire le JSON de la page Snapchat
function extractJSON(html: string): any {
  const regex = /<script[^>]+type="application\/json"[^>]*>(.*?)<\/script>/s;
  const match = html.match(regex);
  
  if (match && match[1]) {
    try {
      return JSON.parse(match[1]);
    } catch (e) {
      console.error('Failed to parse JSON:', e);
      return null;
    }
  }
  return null;
}

// Fonction pour obtenir une valeur depuis un chemin dans le JSON
function getValue(data: any, path: string): any {
  const keys = path.split('.');
  let result = data;
  
  for (const key of keys) {
    if (result && typeof result === 'object') {
      result = result[key];
    } else {
      return undefined;
    }
  }
  
  return result;
}

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    // Faire la requête vers Snapchat
    const url = `https://www.snapchat.com/add/${username}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch Snapchat data');
    }

    const html = await response.text();
    const jsonData = extractJSON(html);

    if (!jsonData) {
      throw new Error('No JSON data found in response');
    }

    // Extraire les données selon la structure de SnapIntel
    const props = jsonData.props || {};
    const pageProps = props.pageProps || {};
    const userProfile = pageProps.userProfile || {};
    
    const pageType = userProfile.pageType;
    const isPrivate = pageType !== 18;

    let result: any = {
      username: username,
      displayName: userProfile.title || username,
      isPrivate: isPrivate,
      stats: {
        stories: 0,
        highlights: 0,
        spotlights: 0,
        lenses: 0
      }
    };

    if (!isPrivate) {
      // Compte public - extraire toutes les stats
      const publicProfileInfo = userProfile.publicProfileInfo || {};
      
      // Stories
      const storySnaps = publicProfileInfo.snapList || [];
      result.stats.stories = storySnaps.length;

      // Highlights
      const curatedHighlights = publicProfileInfo.curatedHighlights || [];
      result.stats.highlights = curatedHighlights.length;

      // Spotlights
      const spotlightHighlights = publicProfileInfo.spotlightHighlights || [];
      result.stats.spotlights = spotlightHighlights.length;

      // Lenses
      const lenses = publicProfileInfo.lenses || [];
      result.stats.lenses = lenses.length;

      // Informations additionnelles
      result.subscriberCount = publicProfileInfo.subscriberCount;
      result.bio = publicProfileInfo.bio;
      result.profilePictureUrl = publicProfileInfo.profilePictureUrl;
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error analyzing user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze user' },
      { status: 500 }
    );
  }
}
// Force redeploy

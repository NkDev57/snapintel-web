import * as cheerio from 'cheerio';

export async function analyzeSnapchatUser(username: string): Promise<any> {
  try {
    const url = `https://www.snapchat.com/add/${username}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error('User not found');
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    
    let jsonData: any = null;
    $('script[type="application/json"]').each((_i, elem) => {
      try {
        const content = $(elem).html();
        if (content) {
          jsonData = JSON.parse(content);
        }
      } catch (e) {}
    });

    if (!jsonData) {
      throw new Error('Could not extract user data');
    }

    const pageType = jsonData.props?.pageProps?.pageType;
    const userProfile = jsonData.props?.pageProps?.userProfile;
    
    const isPrivate = pageType !== 18;
    
    let user: any = {
      username: username,
      displayName: userProfile?.title || username,
      isPrivate: isPrivate,
    };

    if (!isPrivate && userProfile) {
      user.bio = userProfile.bio;
      user.subscriberCount = userProfile.subscriberCount;
      user.profilePictureUrl = userProfile.profilePictureUrl;
    }

    const stories: any[] = [];
    const storySnaps = userProfile?.publicProfileInfo?.storySnaps || [];
    
    storySnaps.forEach((snap: any, index: number) => {
      stories.push({
        snapIndex: index,
        mediaUrl: snap.snapUrls?.mediaUrl,
        timestamp: snap.timestampInSec?.value 
          ? new Date(snap.timestampInSec.value * 1000).toISOString()
          : null,
        mediaType: snap.snapMediaType || 0,
      });
    });

    const curatedHighlights = userProfile?.publicProfileInfo?.curatedHighlights || [];
    const spotlights = userProfile?.publicProfileInfo?.spotlightHighlights || [];
    const lenses = userProfile?.publicProfileInfo?.lenses || [];

    return {
      user,
      stories,
      curatedHighlights,
      spotlights,
      lenses,
      stats: {
        totalStories: stories.length,
        totalHighlights: curatedHighlights.length,
        totalSpotlights: spotlights.length,
        totalLenses: lenses.length,
      }
    };
  } catch (error: any) {
    throw new Error(error.message || 'Failed to analyze user');
  }
}

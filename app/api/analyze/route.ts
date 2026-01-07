import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    console.log(`Scraping Snapchat profile: ${username}`);

    // Lancer Puppeteer avec Chromium
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    
    // Naviguer vers le profil Snapchat
    const url = `https://www.snapchat.com/@${username}`;
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // Attendre que le contenu se charge
    await page.waitForTimeout(5000);

    // Extraire les données des Spotlights
    const spotlights = await page.evaluate(() => {
      const spotlightElements = document.querySelectorAll('[data-testid="spotlight-item"], .Spotlight_item, article');
      const results: any[] = [];
      
      spotlightElements.forEach((el: any) => {
        // Extraire les vues
        const viewsText = el.textContent?.match(/(\d+k|\d+m)/gi);
        if (viewsText) {
          results.push({
            views: viewsText[0],
            element: el.className
          });
        }
      });
      
      return results;
    });

    // Extraire les stories publiques (cercle bleu)
    const hasPublicStories = await page.evaluate(() => {
      // Chercher l'indicateur de story (cercle bleu autour de la photo de profil)
      const profilePic = document.querySelector('[data-testid="profile-picture"], .ProfileHeader_profilePicture');
      if (profilePic) {
        const hasStoryRing = profilePic.classList.contains('has-story') || 
                             profilePic.parentElement?.classList.contains('has-story') ||
                             window.getComputedStyle(profilePic).border.includes('rgb');
        return hasStoryRing;
      }
      return false;
    });

    // Extraire le nom d'affichage
    const displayName = await page.evaluate(() => {
      const nameEl = document.querySelector('h1, [data-testid="display-name"]');
      return nameEl?.textContent || '';
    });

    await browser.close();

    console.log(`Found ${spotlights.length} spotlights, has stories: ${hasPublicStories}`);

    return NextResponse.json({
      username,
      displayName,
      accountType: spotlights.length > 0 || hasPublicStories ? 'mixed_public' : 'private',
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

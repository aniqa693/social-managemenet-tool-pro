import { ApifyClient } from 'apify-client';

if (!process.env.APIFY_API_TOKEN) {
  throw new Error('APIFY_API_TOKEN is not defined');
}

export const apifyClient = new ApifyClient({
  token: process.env.APIFY_API_TOKEN,
});

// YouTube Actor ID
export const YOUTUBE_ACTOR_ID = 'h7sDV53CddomktSi5';

// Facebook Actor ID
export const FACEBOOK_ACTOR_ID = 'q8Go3mwy5RbARydIx';

// Instagram Actor ID
export const INSTAGRAM_ACTOR_ID = 'website-scraper/instagram-reel-scraper';
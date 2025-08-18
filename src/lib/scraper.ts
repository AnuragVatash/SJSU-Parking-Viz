import * as cheerio from 'cheerio';
import crypto from 'crypto';
import { GarageReading } from './database';

export interface ScrapedGarageData {
  garage_id: string;
  garage_name: string;
  address: string;
  occupied_percentage: number;
  map_url?: string;
}

export class ParkingScraper {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = process.env.SJSU_PARKING_URL || 'https://sjsuparkingstatus.sjsu.edu/GarageStatusPlain';
  }

  // Generate a consistent garage ID from garage name
  private generateGarageId(garageName: string): string {
    return garageName.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .trim();
  }

  // Extract garage data from HTML
  async scrapeGarageData(): Promise<ScrapedGarageData[]> {
    try {
      console.log(`Fetching parking data from: ${this.baseUrl}`);
      
      // Configure fetch options with SSL handling for production
      const fetchOptions: RequestInit = {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
        },
        method: 'GET',
      };

      // In Node.js environments (like Vercel), add SSL configuration
      if (typeof window === 'undefined') {
        const https = await import('https');
        (fetchOptions as any).agent = new https.Agent({
          rejectUnauthorized: false // Allow self-signed certificates
        });
      }
      
      const response = await fetch(this.baseUrl, fetchOptions);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);
      
      const garages: ScrapedGarageData[] = [];
      
      // Find garage sections
      $('.garage').each((index, element) => {
        const $garage = $(element);
        
        // Extract garage name (removing extra spaces and line breaks)
        const garageName = $garage.find('.garage__name').text().trim();
        
        // Extract address from the link
        const addressLink = $garage.find('.garage__address');
        const address = addressLink.text().trim();
        const mapUrl = addressLink.attr('href');
        
        // Extract fullness percentage
        const fullnessText = $garage.find('.garage__fullness').text().trim();
        const occupiedPercentage = parseFloat(fullnessText.replace('%', '').trim()) || 0;
        
        if (garageName && address) {
          const garageId = this.generateGarageId(garageName);
          
          garages.push({
            garage_id: garageId,
            garage_name: garageName,
            address: address,
            occupied_percentage: occupiedPercentage,
            map_url: mapUrl
          });
          
          console.log(`Scraped: ${garageName} - ${occupiedPercentage}% (${address})`);
        }
      });

      if (garages.length === 0) {
        console.warn('No garage data found. HTML structure might have changed.');
        console.log('HTML sample:', html.substring(0, 1000));
      }

      return garages;
      
    } catch (error) {
      console.error('Error scraping garage data:', error);
      throw new Error(`Failed to scrape parking data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Convert scraped data to database format
  convertToGarageReadings(scrapedData: ScrapedGarageData[], timestamp?: Date): GarageReading[] {
    const currentTime = timestamp || new Date();
    const sourceHash = this.generateSourceHash(scrapedData);

    return scrapedData.map(garage => ({
      garage_id: garage.garage_id,
      garage_name: garage.garage_name,
      address: garage.address,
      occupied_percentage: garage.occupied_percentage,
      timestamp: currentTime,
      source_hash: sourceHash
    }));
  }

  // Generate a hash of the scraped data to detect changes
  private generateSourceHash(data: ScrapedGarageData[]): string {
    const dataString = JSON.stringify(
      data.map(g => ({ 
        id: g.garage_id, 
        pct: g.occupied_percentage 
      })).sort((a, b) => a.id.localeCompare(b.id))
    );
    return crypto.createHash('md5').update(dataString).digest('hex');
  }

  // Get last updated timestamp from the page
  async getLastUpdatedTime(): Promise<Date | null> {
    try {
      const response = await fetch(this.baseUrl);
      if (!response.ok) return null;
      
      const html = await response.text();
      const $ = cheerio.load(html);
      
      // Look for timestamp in the HTML
      const timestampText = $('.timestamp').text().trim();
      const timestampMatch = timestampText.match(/Last updated\s+(.+?)(?:\s*<|$)/i);
      
      if (timestampMatch) {
        const timestampStr = timestampMatch[1].trim();
        // Parse formats like "2025-8-17 9:01:00 PM"
        const parsed = new Date(timestampStr);
        if (!isNaN(parsed.getTime())) {
          return parsed;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error getting last updated time:', error);
      return null;
    }
  }

  // Health check for the scraper
  async healthCheck(): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const garages = await this.scrapeGarageData();
      
      if (garages.length === 0) {
        return {
          success: false,
          message: 'No garage data found'
        };
      }

      return {
        success: true,
        message: `Successfully scraped ${garages.length} garages`,
        data: {
          garageCount: garages.length,
          garages: garages.map(g => ({
            name: g.garage_name,
            utilization: g.occupied_percentage
          }))
        }
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Export a singleton instance
export const parkingScraper = new ParkingScraper();

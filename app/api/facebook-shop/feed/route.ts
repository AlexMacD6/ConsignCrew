import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get all active listings that are enabled for Facebook Shop
    const listings = await prisma.listing.findMany({
      where: {
        status: 'active',
        facebookShopEnabled: true,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Generate XML feed
    const xmlFeed = generateFacebookShopXML(listings);

    // Return XML response
    return new NextResponse(xmlFeed, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });

  } catch (error) {
    console.error('Error generating Facebook Shop feed:', error);
    return NextResponse.json(
      { error: 'Failed to generate product feed' },
      { status: 500 }
    );
  }
}

function generateFacebookShopXML(listings: any[]): string {
  const baseUrl = process.env.BETTER_AUTH_URL || 'http://localhost:3000';
  const productionUrl = baseUrl.replace('http://localhost:3000', 'https://treasurehub.club');

  const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>TreasureHub Product Feed</title>
    <link>${productionUrl}</link>
    <description>TreasureHub marketplace products for Facebook Shop</description>
    <language>en-US</language>`;

  const xmlFooter = `
  </channel>
</rss>`;

  const items = listings.map(listing => {
    // Get the first photo URL
    const photos = Array.isArray(listing.photos) ? listing.photos : [];
    const imageUrl = photos.length > 0 ? photos[0] : '';

    // Determine availability
    const availability = listing.status === 'active' ? 'in stock' : 'out of stock';

    // Use Facebook condition or map main condition to Facebook format
    const condition = listing.facebookCondition || mapConditionToFacebook(listing.condition);

    // Generate product URL
    const productUrl = `${productionUrl}/listings/${listing.itemId}`;

    // Calculate price with service fee (if applicable)
    const serviceFee = listing.price * 0.15; // 15% service fee
    const finalPrice = listing.price + serviceFee;

    return `
    <item>
      <g:id>${listing.id}</g:id>
      <g:title>${escapeXml(listing.title)}</g:title>
      <g:description>${escapeXml(listing.description)}</g:description>
      <g:link>${productUrl}</g:link>
      <g:image_link>${imageUrl}</g:image_link>
      <g:availability>${availability}</g:availability>
      <g:price>${finalPrice.toFixed(2)} USD</g:price>
      <g:brand>${escapeXml(listing.facebookBrand || listing.brand || 'TreasureHub')}</g:brand>
      <g:condition>${condition}</g:condition>
      <g:product_type>${escapeXml(listing.department)} &gt; ${escapeXml(listing.category)}</g:product_type>
      <g:google_product_category>${mapToGoogleCategory(listing.department, listing.category)}</g:google_product_category>
      <g:custom_label_0>${listing.neighborhood}</g:custom_label_0>
      <g:custom_label_1>${listing.zipCode}</g:custom_label_1>
      <g:custom_label_2>${listing.user.name}</g:custom_label_2>
      <g:mpn>${listing.modelNumber || ''}</g:mpn>
      <g:gtin>${listing.facebookGtin || ''}</g:gtin>
      <g:shipping_weight>
        <g:value>1</g:value>
        <g:unit>lb</g:unit>
      </g:shipping_weight>
      <g:shipping>
        <g:country>US</g:country>
        <g:service>Standard</g:service>
        <g:price>0 USD</g:price>
      </g:shipping>
    </item>`;
  }).join('');

  return xmlHeader + items + xmlFooter;
}

function escapeXml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function mapConditionToFacebook(condition: string): string {
  const conditionMap: { [key: string]: string } = {
    'new': 'new',
    'like-new': 'new',
    'excellent': 'used',
    'good': 'used',
    'fair': 'used',
    'poor': 'used',
    'refurbished': 'refurbished',
    // Handle new Facebook-compatible condition values
    'NEW': 'new',
    'EXCELLENT': 'used',
    'GOOD': 'used',
    'FAIR': 'used',
    'REFURBISHED': 'refurbished',
  };
  
  return conditionMap[condition.toLowerCase()] || 'used';
}

function mapToGoogleCategory(department: string, category: string): string {
  // Map to Google Product Category taxonomy
  const categoryMap: { [key: string]: string } = {
    'Electronics': '293',
    'Clothing': '1604',
    'Home & Garden': '1592',
    'Sports & Outdoors': '888',
    'Toys & Games': '220',
    'Books': '266',
    'Automotive': '261',
    'Health & Beauty': '180',
    'Jewelry': '281',
    'Tools': '631',
    'Collectibles': '220',
    'Antiques': '220',
  };

  return categoryMap[department] || '220'; // Default to "Toys & Games"
} 
/**
 * Admin API endpoint to export any database table to CSV
 * Provides flexible data export functionality for administrators
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../lib/auth';
import { prisma } from '../../../../lib/prisma';

// Define all available tables for export with their display names
const EXPORTABLE_TABLES = {
  user: { name: 'Users', model: 'user' },
  listing: { name: 'Listings', model: 'listing' },
  order: { name: 'Orders', model: 'order' },
  cart: { name: 'Carts', model: 'cart' },
  cartItem: { name: 'Cart Items', model: 'cartItem' },
  photoGallery: { name: 'Photo Gallery', model: 'photoGallery' },
  video: { name: 'Videos', model: 'video' },
  organization: { name: 'Organizations', model: 'organization' },
  member: { name: 'Organization Members', model: 'member' },
  invitation: { name: 'Invitations', model: 'invitation' },
  team: { name: 'Teams', model: 'team' },
  teamMember: { name: 'Team Members', model: 'teamMember' },
  inventoryList: { name: 'Inventory Lists', model: 'inventoryList' },
  inventoryItem: { name: 'Inventory Items', model: 'inventoryItem' },
  question: { name: 'Questions', model: 'question' },
  promoCode: { name: 'Promo Codes', model: 'promoCode' },
  savedListing: { name: 'Saved Listings', model: 'savedListing' },
  hiddenListing: { name: 'Hidden Listings', model: 'hiddenListing' },
  mobileItem: { name: 'Mobile Items', model: 'mobileItem' },
  mobileItemMetadata: { name: 'Mobile Item Metadata', model: 'mobileItemMetadata' },
  priceHistory: { name: 'Price History', model: 'priceHistory' },
  listingHistory: { name: 'Listing History', model: 'listingHistory' },
  session: { name: 'Sessions', model: 'session' },
  account: { name: 'Accounts', model: 'account' },
  verificationToken: { name: 'Verification Tokens', model: 'verificationToken' },
  verification: { name: 'Verifications', model: 'verification' },
} as const;

type TableKey = keyof typeof EXPORTABLE_TABLES;

/**
 * GET endpoint to retrieve list of available tables
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin in any organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        members: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is admin or owner in any organization
    const isAdmin = user.members.some(member => 
      member.role === 'ADMIN' || member.role === 'OWNER'
    );

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Return available tables
    const tables = Object.entries(EXPORTABLE_TABLES).map(([key, value]) => ({
      key,
      name: value.name,
    }));

    return NextResponse.json({ tables });

  } catch (error) {
    console.error('Error fetching exportable tables:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exportable tables' },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint to export table data as CSV
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin in any organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        members: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is admin or owner in any organization
    const isAdmin = user.members.some(member => 
      member.role === 'ADMIN' || member.role === 'OWNER'
    );

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { table } = body;

    // Validate table name
    if (!table || !(table in EXPORTABLE_TABLES)) {
      return NextResponse.json({ error: 'Invalid table name' }, { status: 400 });
    }

    const tableKey = table as TableKey;
    const tableConfig = EXPORTABLE_TABLES[tableKey];

    console.log(`Admin ${user.name} (${session.user.id}) exporting table: ${tableConfig.name}`);

    // Fetch data from the specified table
    // @ts-ignore - Dynamic model access
    const data = await prisma[tableConfig.model].findMany();

    if (!data || data.length === 0) {
      return NextResponse.json({ 
        error: 'No data found in this table',
        csv: '',
        rowCount: 0 
      }, { status: 200 });
    }

    // Convert to CSV
    const csv = convertToCSV(data);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `${tableConfig.model}-export-${timestamp}.csv`;

    console.log(`✅ Exported ${data.length} rows from ${tableConfig.name}`);

    // Return CSV data
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Row-Count': data.length.toString(),
      },
    });

  } catch (error) {
    console.error('Error exporting table:', error);
    return NextResponse.json(
      { error: 'Failed to export table data' },
      { status: 500 }
    );
  }
}

/**
 * Convert array of objects to CSV format
 */
function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';

  // Get all unique keys from all objects (in case of inconsistent data)
  const allKeys = new Set<string>();
  data.forEach(row => {
    Object.keys(row).forEach(key => allKeys.add(key));
  });

  const headers = Array.from(allKeys);

  // Build CSV rows
  const rows = data.map(row => {
    return headers.map(header => {
      let value = row[header];

      // Handle different data types
      if (value === null || value === undefined) {
        return '';
      }

      // Convert objects/arrays to JSON strings
      if (typeof value === 'object') {
        value = JSON.stringify(value);
      }

      // Convert to string and escape quotes
      value = String(value).replace(/"/g, '""');

      // Wrap in quotes if contains comma, newline, or quotes
      if (value.includes(',') || value.includes('\n') || value.includes('"')) {
        return `"${value}"`;
      }

      return value;
    }).join(',');
  });

  // Combine headers and rows
  return [headers.join(','), ...rows].join('\n');
}


import { NextRequest, NextResponse } from 'next/server';
import { isUserAdmin } from '@/lib/auth-utils';

/**
 * GET /api/admin/download-photos?photoUrl=xxx&filename=xxx
 * Download a single photo file - Admin only
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📸 API: Download photo request received');
    
    // Check if user is admin
    const isAdmin = await isUserAdmin(request.headers);
    console.log('📸 API: Admin check result:', isAdmin);
    
    if (!isAdmin) {
      console.log('📸 API: Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const photoUrl = searchParams.get('photoUrl');
    const filename = searchParams.get('filename');
    
    console.log('📸 API: Request params:', { photoUrl, filename });

    if (!photoUrl) {
      console.log('📸 API: Missing photo URL');
      return NextResponse.json({ error: 'Photo URL is required' }, { status: 400 });
    }

    // Ensure the URL is properly formatted
    let downloadUrl = photoUrl;
    if (!downloadUrl.startsWith('http')) {
      downloadUrl = `https://${downloadUrl}`;
    }
    
    console.log('📸 API: Final download URL:', downloadUrl);

    // Validate it's an image URL
    if (!/\.(jpg|jpeg|png|gif|webp|bmp)(\?|$)/i.test(downloadUrl)) {
      console.log('📸 API: Invalid image URL format');
      return NextResponse.json({ error: 'Invalid image URL' }, { status: 400 });
    }

    try {
      console.log('📸 API: Fetching image from URL...');
      // Fetch the image file
      const imageResponse = await fetch(downloadUrl);
      
      console.log('📸 API: Image fetch response status:', imageResponse.status);
      
      if (!imageResponse.ok) {
        console.log('📸 API: Failed to fetch image, status:', imageResponse.status);
        return NextResponse.json({ error: 'Failed to fetch image file' }, { status: 404 });
      }

      // Get the image content
      const imageBuffer = await imageResponse.arrayBuffer();
      console.log('📸 API: Image buffer size:', imageBuffer.byteLength);
      
      // Determine content type from the URL or default to jpeg
      let contentType = 'image/jpeg';
      if (downloadUrl.match(/\.png(\?|$)/i)) contentType = 'image/png';
      else if (downloadUrl.match(/\.gif(\?|$)/i)) contentType = 'image/gif';
      else if (downloadUrl.match(/\.webp(\?|$)/i)) contentType = 'image/webp';
      else if (downloadUrl.match(/\.bmp(\?|$)/i)) contentType = 'image/bmp';
      
      console.log('📸 API: Detected content type:', contentType);
      
      // Use provided filename or extract from URL
      const finalFilename = filename || downloadUrl.split('/').pop() || 'photo.jpg';
      console.log('📸 API: Final filename:', finalFilename);
      
      // Return the image file with download headers
      console.log('📸 API: Returning image with download headers');
      return new NextResponse(imageBuffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${finalFilename}"`,
          'Content-Length': imageBuffer.byteLength.toString(),
        },
      });
    } catch (fetchError) {
      console.error('Error fetching image:', fetchError);
      return NextResponse.json({ error: 'Failed to download image file' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in download-photos API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/download-photos
 * Validate multiple photo URLs - Admin only
 */
export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const isAdmin = await isUserAdmin(request.headers);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { photoUrls } = body;

    if (!photoUrls || !Array.isArray(photoUrls) || photoUrls.length === 0) {
      return NextResponse.json({ error: 'Photo URLs array is required' }, { status: 400 });
    }

    // Validate and process photo URLs
    const validPhotoUrls = photoUrls.filter(url => {
      if (typeof url !== 'string' || !url.trim()) return false;
      
      // Ensure URL is properly formatted
      const fullUrl = url.startsWith('http') ? url : `https://${url}`;
      
      // Check if it's an image URL
      return /\.(jpg|jpeg|png|gif|webp|bmp)(\?|$)/i.test(fullUrl);
    });

    if (validPhotoUrls.length === 0) {
      return NextResponse.json({ error: 'No valid photo URLs found' }, { status: 400 });
    }

    // Return the validated URLs
    return NextResponse.json({ 
      success: true,
      photoUrls: validPhotoUrls.map(url => url.startsWith('http') ? url : `https://${url}`),
      count: validPhotoUrls.length
    });

  } catch (error) {
    console.error('Error in download-photos API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

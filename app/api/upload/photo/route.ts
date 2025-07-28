import { NextRequest, NextResponse } from 'next/server';
import { 
  getUploadUrl, 
  ImagePrefix, 
  getPublicUrl, 
  validateFileSize, 
  getMaxFileSize 
} from '../../../../src/aws/imageStore';

export async function POST(request: NextRequest) {
  try {
    const { auth } = await import('../../../lib/auth');
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const photoType = formData.get('photoType') as string;
    const itemId = formData.get('itemId') as string;

    if (!file || !photoType || !itemId) {
      return NextResponse.json({ 
        error: 'Missing required fields: file, photoType, itemId' 
      }, { status: 400 });
    }

    // Validate file size
    const maxSize = getMaxFileSize(ImagePrefix.Raw);
    if (!validateFileSize(ImagePrefix.Raw, file.size)) {
      return NextResponse.json({ 
        error: `File size ${file.size} bytes exceeds maximum ${maxSize} bytes` 
      }, { status: 400 });
    }

    // Get pre-signed URL for upload
    const { url, key } = await getUploadUrl({
      prefix: ImagePrefix.Raw,
      itemId,
      ext: file.name.endsWith('.png') ? 'png' : 'jpg',
      contentType: file.type,
    });

    // Upload file to S3
    const uploadResponse = await fetch(url, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('S3 upload failed:', {
        status: uploadResponse.status,
        statusText: uploadResponse.statusText,
        error: errorText,
        url: url,
        contentType: file.type,
        fileSize: file.size
      });
      return NextResponse.json({ 
        error: `Failed to upload file to S3: ${uploadResponse.status} ${uploadResponse.statusText}` 
      }, { status: 500 });
    }

    console.log('S3 upload successful:', {
      status: uploadResponse.status,
      statusText: uploadResponse.statusText,
      key: key,
      fileSize: file.size
    });

    // Get public URL
    const publicUrl = getPublicUrl(key);

    return NextResponse.json({ 
      success: true, 
      key, 
      url: publicUrl,
      fileName: file.name 
    });

  } catch (error) {
    console.error('Error uploading photo:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Upload failed' 
    }, { status: 500 });
  }
} 
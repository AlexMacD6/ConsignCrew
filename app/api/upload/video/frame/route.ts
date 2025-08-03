import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { s3Client } from '@/aws/s3Client';
import { PutObjectCommand } from '@aws-sdk/client-s3';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const videoId = formData.get('videoId') as string;
    const frameIndex = formData.get('frameIndex') as string;

    if (!file || !videoId || !frameIndex) {
      return NextResponse.json(
        { error: 'Missing file, videoId, or frameIndex' },
        { status: 400 }
      );
    }

    // Get video record to determine the folder structure
    const video = await prisma.video.findUnique({
      where: { id: videoId }
    });

    if (!video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    console.log('Video record for frame upload:', video);

    // Create S3 key for the frame using rawVideoKey
    const timestamp = Date.now();
    // Extract the directory path from the raw video key (removing the filename)
    const videoDir = video.rawVideoKey.split('/').slice(0, -1).join('/');
    const frameKey = `${videoDir}/frames/frame-${frameIndex}-${timestamp}.jpg`;
    
    console.log('Frame key generated:', frameKey);

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to S3
    const uploadParams = {
      Bucket: 'consigncrew',
      Key: frameKey,
      Body: buffer,
      ContentType: 'image/jpeg',
      Metadata: {
        videoId: videoId,
        frameIndex: frameIndex,
        uploadedAt: new Date().toISOString()
      }
    };

    await s3Client.send(new PutObjectCommand(uploadParams));

    // Generate CloudFront URL
    const cloudFrontUrl = `https://dtlqyjbwka60p.cloudfront.net/${frameKey}`;

    return NextResponse.json({
      success: true,
      url: cloudFrontUrl,
      frameIndex: parseInt(frameIndex)
    });

  } catch (error) {
    console.error('Frame upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload frame' },
      { status: 500 }
    );
  }
}
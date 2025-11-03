/**
 * Generate thumbnails for existing photos that don't have them
 * Run with: node scripts/generate-missing-thumbnails.js
 */

const { PrismaClient } = require('@prisma/client');
const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const sharp = require('sharp');

const prisma = new PrismaClient();

async function generateMissingThumbnails() {
  console.log('🔍 Finding photos without thumbnails...\n');

  try {
    // Find all photos without thumbnails
    const photosWithoutThumbnails = await prisma.photoGallery.findMany({
      where: {
        OR: [
          { thumbnailUrl: null },
          { thumbnailUrl: '' },
        ],
      },
      select: {
        id: true,
        userId: true,
        s3Key: true,
        url: true,
        originalFilename: true,
      },
    });

    console.log(`Found ${photosWithoutThumbnails.length} photos without thumbnails\n`);

    if (photosWithoutThumbnails.length === 0) {
      console.log('✅ All photos already have thumbnails!');
      return;
    }

    // Initialize S3 client
    const s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    const bucketName = process.env.S3_BUCKET;
    let successCount = 0;
    let failCount = 0;

    // Process each photo
    for (const photo of photosWithoutThumbnails) {
      try {
        console.log(`📸 Processing: ${photo.originalFilename}`);
        console.log(`   Photo ID: ${photo.id}`);
        console.log(`   S3 Key: ${photo.s3Key}`);

        // Download original image from S3
        const getCommand = new GetObjectCommand({
          Bucket: bucketName,
          Key: photo.s3Key,
        });

        const response = await s3Client.send(getCommand);
        const imageBuffer = await streamToBuffer(response.Body);

        console.log(`   ✓ Downloaded original (${imageBuffer.length} bytes)`);

        // Get image metadata and dimensions
        const imageMetadata = await sharp(imageBuffer).metadata();
        const width = imageMetadata.width || null;
        const height = imageMetadata.height || null;

        console.log(`   ✓ Image dimensions: ${width}x${height}`);

        // Generate thumbnail
        const thumbnailBuffer = await sharp(imageBuffer)
          .resize(400, 400, {
            fit: 'inside',
            withoutEnlargement: true,
          })
          .jpeg({ quality: 80 })
          .toBuffer();

        console.log(`   ✓ Generated thumbnail (${thumbnailBuffer.length} bytes)`);

        // Create thumbnail S3 key
        const filename = photo.s3Key.split('/').pop();
        const thumbnailS3Key = `photo-gallery/${photo.userId}/thumbnails/thumb-${filename}`;

        // Upload thumbnail to S3
        const putCommand = new PutObjectCommand({
          Bucket: bucketName,
          Key: thumbnailS3Key,
          Body: thumbnailBuffer,
          ContentType: 'image/jpeg',
        });

        await s3Client.send(putCommand);
        console.log(`   ✓ Uploaded thumbnail to S3`);

        // Generate thumbnail URL
        let cdnDomain = process.env.NEXT_PUBLIC_CDN_URL || `https://${bucketName}.s3.us-east-1.amazonaws.com`;
        if (cdnDomain && !cdnDomain.startsWith('http://') && !cdnDomain.startsWith('https://')) {
          cdnDomain = `https://${cdnDomain}`;
        }
        const thumbnailUrl = `${cdnDomain}/${thumbnailS3Key}`;

        // Update database
        await prisma.photoGallery.update({
          where: { id: photo.id },
          data: {
            thumbnailUrl,
            width,
            height,
          },
        });

        console.log(`   ✓ Updated database with thumbnail URL`);
        console.log(`   ✅ SUCCESS\n`);
        successCount++;

      } catch (error) {
        console.error(`   ❌ FAILED: ${error.message}\n`);
        failCount++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 Summary:');
    console.log(`   Total processed: ${photosWithoutThumbnails.length}`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    console.log('='.repeat(50) + '\n');

    if (successCount > 0) {
      console.log('🎉 Thumbnails generated successfully!');
      console.log('   Refresh your Photo Gallery to see the changes.');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Helper function to convert stream to buffer
async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

// Run the script
generateMissingThumbnails()
  .then(() => {
    console.log('✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });


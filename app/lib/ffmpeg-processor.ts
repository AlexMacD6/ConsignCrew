import { spawn } from 'child_process';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { createReadStream, createWriteStream, unlink, mkdir } from 'fs';
import { join, dirname } from 'path';
import { promisify } from 'util';
import { pipeline } from 'stream';
import ffmpegStatic from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';

// Alternative import for compatibility
const ffmpegPath = ffmpegStatic || require('ffmpeg-static');
const ffprobePathRaw = ffprobeStatic || require('ffprobe-static');

// Extract the actual path from ffprobe-static (it returns an object with path property)
const ffprobePath = typeof ffprobePathRaw === 'string' ? ffprobePathRaw : ffprobePathRaw?.path;

/**
 * Check if FFmpeg is available on the system
 */
export async function isFFmpegAvailable(): Promise<boolean> {
  console.log('🎬 FFmpeg Availability Check:');
  console.log('  - FFmpeg static path:', ffmpegPath);
  console.log('  - FFmpeg static (direct):', ffmpegStatic);
  console.log('  - Node environment:', process.env.NODE_ENV);
  console.log('  - Platform:', process.platform);
  
  if (!ffmpegPath) {
    console.error('❌ ffmpeg-static package did not provide a path');
    return false;
  }
  
  return new Promise((resolve) => {
    const ffmpegProcess = spawn(ffmpegPath, ['-version']);
    
    ffmpegProcess.on('error', () => {
      resolve(false);
    });
    
    ffmpegProcess.on('close', (code) => {
      resolve(code === 0);
    });
    
    // Timeout after 5 seconds
    setTimeout(() => {
      ffmpegProcess.kill();
      resolve(false);
    }, 5000);
  });
}

/**
 * Check if FFprobe is available on the system
 */
export async function isFFprobeAvailable(): Promise<boolean> {
  console.log('🔍 FFprobe Availability Check:');
  console.log('  - FFprobe raw import:', ffprobePathRaw);
  console.log('  - FFprobe extracted path:', ffprobePath);
  console.log('  - FFprobe static (direct):', ffprobeStatic);
  console.log('  - Node environment:', process.env.NODE_ENV);
  console.log('  - Platform:', process.platform);
  
  if (!ffprobePath) {
    console.error('❌ ffprobe-static package did not provide a path');
    return false;
  }
  
  return new Promise((resolve) => {
    const ffprobeProcess = spawn(ffprobePath, ['-version']);
    
    ffprobeProcess.on('error', () => {
      resolve(false);
    });
    
    ffprobeProcess.on('close', (code) => {
      resolve(code === 0);
    });
    
    // Timeout after 5 seconds
    setTimeout(() => {
      ffprobeProcess.kill();
      resolve(false);
    }, 5000);
  });
}

// S3 Client Configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.S3_BUCKET || 'consigncrew';

// Promisify file operations
const unlinkAsync = promisify(unlink);
const mkdirAsync = promisify(mkdir);

/**
 * Video processing configuration
 */
interface VideoProcessingConfig {
  inputPath: string;
  outputPath: string;
  thumbnailPath: string;
  framesDir: string;
  videoId: string;
}

/**
 * Video metadata from FFprobe
 */
interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  bitrate: number;
  fps: number;
}

/**
 * Get video metadata using FFprobe
 */
export async function getVideoMetadata(inputPath: string): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    // Use ffprobe to get metadata
    const ffprobeProcess = spawn(ffprobePath, [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      '-show_streams',
      inputPath
    ]);

    let output = '';
    let error = '';

    ffprobeProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    ffprobeProcess.stderr.on('data', (data) => {
      error += data.toString();
    });

    ffprobeProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`FFmpeg metadata extraction failed: ${error}`));
        return;
      }

      try {
        const metadata = JSON.parse(output);
        const videoStream = metadata.streams.find((stream: any) => stream.codec_type === 'video');
        const format = metadata.format;

        resolve({
          duration: parseFloat(format.duration),
          width: videoStream.width,
          height: videoStream.height,
          bitrate: parseInt(format.bit_rate),
          fps: eval(videoStream.r_frame_rate), // e.g., "30/1" -> 30
        });
      } catch (err) {
        reject(new Error(`Failed to parse FFmpeg metadata output: ${err}`));
      }
    });
  });
}

/**
 * Compress video using FFmpeg
 */
export async function compressVideo(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Ensure output directory exists
    const outputDir = dirname(outputPath);
    mkdirAsync(outputDir, { recursive: true }).catch(() => {});

    const ffmpegProcess = spawn(ffmpegPath, [
      '-i', inputPath,
      '-c:v', 'libx264',        // H.264 codec
      '-crf', '28',             // Constant Rate Factor (quality)
      '-preset', 'medium',      // Encoding speed preset
      '-c:a', 'aac',            // AAC audio codec
      '-b:a', '128k',           // Audio bitrate
      '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', // Ensure even dimensions
      '-movflags', '+faststart', // Optimize for web streaming
      '-y',                     // Overwrite output file
      outputPath
    ]);

    let error = '';

    ffmpegProcess.stderr.on('data', (data) => {
      error += data.toString();
    });

    ffmpegProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`FFmpeg compression failed: ${error}`));
        return;
      }
      resolve();
    });
  });
}

/**
 * Generate thumbnail from video
 */
export async function generateThumbnail(inputPath: string, outputPath: string, timeOffset: number = 3): Promise<void> {
  return new Promise((resolve, reject) => {
    // Ensure output directory exists
    const outputDir = dirname(outputPath);
    mkdirAsync(outputDir, { recursive: true }).catch(() => {});

    const ffmpegProcess = spawn(ffmpegPath, [
      '-i', inputPath,
      '-ss', timeOffset.toString(), // Seek to 3 seconds
      '-vframes', '1',             // Extract 1 frame
      '-q:v', '2',                 // High quality
      '-y',                        // Overwrite output file
      outputPath
    ]);

    let error = '';

    ffmpegProcess.stderr.on('data', (data) => {
      error += data.toString();
    });

    ffmpegProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`FFmpeg thumbnail generation failed: ${error}`));
        return;
      }
      resolve();
    });
  });
}

/**
 * Extract frames at specific time percentages
 */
export async function extractFrames(
  inputPath: string, 
  framesDir: string, 
  videoId: string,
  duration: number
): Promise<string[]> {
  // Frame extraction percentages for AI analysis
  const percentages = [0, 10, 25, 50, 90];
  const framePaths: string[] = [];

  // Ensure frames directory exists
  await mkdirAsync(framesDir, { recursive: true });

  for (let i = 0; i < percentages.length; i++) {
    const percentage = percentages[i];
    const timeOffset = (duration * percentage) / 100;
    // Use frame_01.jpg, frame_02.jpg, etc. naming convention
    const frameNumber = (i + 1).toString().padStart(2, '0');
    const framePath = join(framesDir, `frame_${frameNumber}.jpg`);

    console.log(`Extracting frame ${frameNumber} at ${percentage}% (${timeOffset.toFixed(2)}s) to ${framePath}`);

    await new Promise<void>((resolve, reject) => {
      const ffmpegProcess = spawn(ffmpegPath, [
        '-i', inputPath,
        '-ss', timeOffset.toString(),
        '-frames:v', '1',
        '-q:v', '2',
        '-vf', 'scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2',
        '-y',
        framePath
      ]);

      let error = '';

      ffmpegProcess.stderr.on('data', (data) => {
        error += data.toString();
      });

      ffmpegProcess.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`FFmpeg frame extraction failed at ${percentage}% (${timeOffset}s): ${error}`));
          return;
        }
        framePaths.push(framePath);
        console.log(`Extracted frame ${frameNumber} at ${percentage}% (${timeOffset.toFixed(2)}s)`);
        resolve();
      });
    });
  }

  return framePaths;
}

/**
 * Upload file to S3
 */
async function uploadToS3(filePath: string, s3Key: string, contentType: string): Promise<void> {
  const fileStream = createReadStream(filePath);
  
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
    Body: fileStream,
    ContentType: contentType,
  });

  await s3Client.send(command);
}

/**
 * Download file from S3
 */
async function downloadFromS3(s3Key: string, localPath: string): Promise<void> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
  });

  const response = await s3Client.send(command);
  const fileStream = createWriteStream(localPath);
  
  if (response.Body) {
    await new Promise<void>((resolve, reject) => {
      pipeline(response.Body as any, fileStream, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

/**
 * Process video with FFmpeg pipeline
 */
export async function processVideo(
  rawVideoKey: string,
  videoId: string,
  userId: string
): Promise<{
  processedVideoKey: string;
  thumbnailKey: string;
  frameKeys: string[];
  metadata: VideoMetadata;
}> {
  // Check if FFmpeg and FFprobe are available
  const ffmpegAvailable = await isFFmpegAvailable();
  const ffprobeAvailable = await isFFprobeAvailable();
  
  if (!ffmpegAvailable || !ffprobeAvailable) {
    console.log('FFmpeg/FFprobe not available, waiting for installation...');
    
    // Wait for FFmpeg to become available (retry a few times)
    for (let i = 0; i < 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      
      const retryFFmpeg = await isFFmpegAvailable();
      const retryFFprobe = await isFFprobeAvailable();
      
      if (retryFFmpeg && retryFFprobe) {
        console.log('FFmpeg/FFprobe became available, proceeding with processing');
        break;
      }
      
      if (i === 9) {
        throw new Error('FFmpeg/FFprobe not available after multiple retries. Please install FFmpeg to process videos.');
      }
    }
  }
    
         

  // Create temporary directory for processing
  const tempDir = join(process.cwd(), 'temp', videoId);
  await mkdirAsync(tempDir, { recursive: true });

  const inputPath = join(tempDir, 'input.mp4');
  const outputPath = join(tempDir, 'output.mp4');
  const thumbnailPath = join(tempDir, 'thumbnail.jpg');
  const framesDir = join(tempDir, 'frames');

  try {
    // Download raw video from S3
    console.log(`Downloading raw video: ${rawVideoKey}`);
    await downloadFromS3(rawVideoKey, inputPath);

    // Get video metadata
    console.log('Getting video metadata...');
    const metadata = await getVideoMetadata(inputPath);
    console.log('Video metadata:', metadata);

    // Compress video
    console.log('Compressing video...');
    await compressVideo(inputPath, outputPath);

    // Generate thumbnail
    console.log('Generating thumbnail...');
    await generateThumbnail(inputPath, thumbnailPath, 3);

    // Extract frames for AI analysis
    console.log('Extracting frames...');
    console.log('Input path:', inputPath);
    console.log('Frames directory:', framesDir);
    console.log('Video duration:', metadata.duration);
    const framePaths = await extractFrames(inputPath, framesDir, videoId, metadata.duration);
    console.log('Frame paths extracted:', framePaths);
    console.log('Frame count:', framePaths.length);

    // Generate S3 keys
    const processedVideoKey = `processed/videos/${videoId}.mp4`;
    const thumbnailKey = `processed/thumbnails/${videoId}.jpg`;
    const frameKeys = [
      `processed/frames/${videoId}/frame_01.jpg`,
      `processed/frames/${videoId}/frame_02.jpg`,
      `processed/frames/${videoId}/frame_03.jpg`,
      `processed/frames/${videoId}/frame_04.jpg`,
      `processed/frames/${videoId}/frame_05.jpg`,
    ];

    // Upload processed video
    console.log('Uploading processed video...');
    await uploadToS3(outputPath, processedVideoKey, 'video/mp4');

    // Upload thumbnail
    console.log('Uploading thumbnail...');
    await uploadToS3(thumbnailPath, thumbnailKey, 'image/jpeg');

    // Upload frames
    console.log('Uploading frames...');
    console.log('Frame paths to upload:', framePaths);
    console.log('Frame keys to upload to:', frameKeys);
    for (let i = 0; i < framePaths.length; i++) {
      console.log(`Uploading frame ${i + 1}: ${framePaths[i]} to ${frameKeys[i]}`);
      await uploadToS3(framePaths[i], frameKeys[i], 'image/jpeg');
      console.log(`Frame ${i + 1} uploaded successfully`);
    }

    return {
      processedVideoKey,
      thumbnailKey,
      frameKeys,
      metadata,
    };

  } finally {
    // Clean up temporary files
    try {
      await unlinkAsync(inputPath);
      await unlinkAsync(outputPath);
      await unlinkAsync(thumbnailPath);
      
      // Clean up frame files
      const framePaths = [
        join(framesDir, 'frame_01.jpg'),
        join(framesDir, 'frame_02.jpg'),
        join(framesDir, 'frame_03.jpg'),
        join(framesDir, 'frame_04.jpg'),
        join(framesDir, 'frame_05.jpg'),
      ];
      
      for (const framePath of framePaths) {
        try {
          await unlinkAsync(framePath);
        } catch (err) {
          // Ignore errors if file doesn't exist
        }
      }
      
      // Remove temp directory
      try {
        const { rmdir } = require('fs').promises;
        await rmdir(tempDir, { recursive: true });
      } catch (err) {
        // Ignore cleanup errors
      }
    } catch (err) {
      console.error('Error cleaning up temporary files:', err);
    }
  }
} 
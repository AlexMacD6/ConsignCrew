# TreasureHub

A comprehensive marketplace platform for buying and selling items with AI-powered listing generation.

## Features

- **AI-Powered Listing Generation**: Automatically generates comprehensive product listings using GPT-4o
- **Video Upload & Processing**: Upload videos with automatic compression, thumbnail generation, and frame extraction
- **Photo Management**: Multi-step photo upload with S3 integration
- **Facebook Shop Integration**: Seamless integration with Facebook Marketplace
- **User Authentication**: Secure authentication with BetterAuth
- **Zip Code Validation**: Location-based service area validation

## Prerequisites

### FFmpeg Installation (Required for Video Processing)

The video upload feature requires FFmpeg to be installed on your system for video processing, compression, and frame extraction.

#### Windows
```bash
# Using winget (recommended)
winget install ffmpeg

# Using Chocolatey
choco install ffmpeg

# Manual installation
# 1. Download FFmpeg from https://ffmpeg.org/download.html
# 2. Extract the files to a folder (e.g., C:\ffmpeg)
# 3. Add the bin folder to your system PATH
# 4. Restart your terminal/command prompt
```

#### macOS
```bash
# Using Homebrew
brew install ffmpeg

# Or using MacPorts
sudo port install ffmpeg
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install ffmpeg
```

#### Linux (CentOS/RHEL)
```bash
sudo yum install ffmpeg
# Or for newer versions
sudo dnf install ffmpeg
```

### Verify Installation
After installation, verify FFmpeg is working:
```bash
ffmpeg -version
ffprobe -version
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="your_database_url"

# AWS Configuration
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your_aws_access_key"
AWS_SECRET_ACCESS_KEY="your_aws_secret_key"
S3_BUCKET="your_s3_bucket_name"

# BetterAuth Configuration
BETTER_AUTH_SECRET="your_betterauth_secret"
BETTER_AUTH_URL="http://localhost:3000"

# CDN Configuration
NEXT_PUBLIC_CDN_URL="https://your-cdn-domain.com"

# OpenAI Configuration (for AI features)
OPENAI_API_KEY="your_openai_api_key"
```

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd TreasureHub
```

2. Install dependencies:
```bash
npm install
```

3. Set up the database:
```bash
npx prisma generate
npx prisma migrate dev
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Video Processing

The video upload feature includes:
- **Automatic Compression**: Videos are compressed to ~720p H.264 with CRF 28
- **Thumbnail Generation**: Preview thumbnails are generated at 3 seconds
- **Frame Extraction**: 5 AI-readable frames are extracted for analysis
- **Background Processing**: Videos are processed asynchronously while users continue with other steps

If FFmpeg is not installed, the system will gracefully fall back to using the raw video without processing.

## API Endpoints

### Video Upload
- `POST /api/upload/video/presigned-url` - Generate presigned URL for video upload
- `POST /api/upload/video/process` - Trigger video processing
- `GET /api/upload/video/status/[videoId]` - Check video processing status

### Photo Upload
- `POST /api/upload/photo/presigned-url` - Generate presigned URL for photo upload

### AI Services
- `POST /api/ai/generate-comprehensive-listing` - Generate AI-powered listing
- `POST /api/ai/generate-form-fields` - Generate form fields from photos

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
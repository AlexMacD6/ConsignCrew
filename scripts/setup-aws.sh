#!/bin/bash

# AWS S3 Setup Script for ConsignCrew
# This script helps set up the AWS S3 bucket and IAM role for photo uploads

set -e

echo "🚀 Setting up AWS S3 for ConsignCrew photo uploads..."

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first:"
    echo "   https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials are not configured. Please run:"
    echo "   aws configure"
    exit 1
fi

# Get current AWS account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=${AWS_REGION:-us-east-1}
BUCKET_NAME=${AWS_S3_BUCKET_NAME:-consigncrew-photos}

echo "📋 Configuration:"
echo "   Account ID: $ACCOUNT_ID"
echo "   Region: $REGION"
echo "   Bucket Name: $BUCKET_NAME"

# Create S3 bucket
echo "🪣 Creating S3 bucket..."
aws s3api create-bucket \
    --bucket $BUCKET_NAME \
    --region $REGION \
    --create-bucket-configuration LocationConstraint=$REGION

# Configure CORS
echo "🔧 Configuring CORS..."
aws s3api put-bucket-cors \
    --bucket $BUCKET_NAME \
    --cors-configuration file://aws-s3-cors.json

echo "✅ AWS S3 setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Add the following environment variables to your .env file:"
echo "   AWS_ACCESS_KEY_ID=your_access_key"
echo "   AWS_SECRET_ACCESS_KEY=your_secret_key"
echo "   AWS_REGION=$REGION"
echo "   AWS_S3_BUCKET_NAME=$BUCKET_NAME"
echo ""
echo "2. Update the CORS configuration in aws-s3-cors.json with your domain"
echo "3. Test the photo upload functionality" 
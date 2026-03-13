import boto3
import os
import sys

def upload_file(file_path, bucket, object_name=None):
    # AWS Credentials (already provided in docker-compose, but we need them here)
    # Note: In a real scenario, use environment variables or aws configure
    aws_access_key = os.getenv("AWS_ACCESS_KEY_ID")
    aws_secret_key = os.getenv("AWS_SECRET_ACCESS_KEY")
    region = os.getenv("AWS_REGION", "eu-north-1")

    if object_name is None:
        object_name = os.path.basename(file_path)

    # Upload the file
    s3_client = boto3.client(
        's3',
        aws_access_key_id=aws_access_key,
        aws_secret_access_key=aws_secret_key,
        region_name=region
    )
    
    try:
        print(f"Uploading {file_path} to {bucket}/{object_name}...")
        s3_client.upload_file(
            file_path, 
            bucket, 
            object_name,
            ExtraArgs={'ContentType': 'video/mp4'}
        )
        url = f"https://{bucket}.s3.{region}.amazonaws.com/{object_name}"
        print(f"Upload Successful! URL: {url}")
        return url
    except Exception as e:
        print(f"Error: {e}")
        return None

if __name__ == "__main__":
    # Default values from arguments if provided
    file_to_upload = sys.argv[1] if len(sys.argv) > 1 else "/home/abhijeet/Desktop/learnsphere/frontend/public/63328-506377472 (1).mp4"
    target_bucket = sys.argv[2] if len(sys.argv) > 2 else "learnsphere-files1"
    target_name = sys.argv[3] if len(sys.argv) > 3 else "63328-506377472 (1).mp4"
    
    if not os.path.exists(file_to_upload):
        print(f"Error: Local file not found at {file_to_upload}")
        sys.exit(1)
        
    upload_file(file_to_upload, target_bucket, target_name)

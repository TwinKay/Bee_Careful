# s3_handler.py
# This module handles interactions with a single, pre-configured AWS S3 bucket,
# including downloading and uploading objects. Assumes S3_BUCKET_NAME is correctly set if not None/empty.

import os
import boto3
from botocore.exceptions import ClientError, NoCredentialsError, PartialCredentialsError


# Initialize S3 client
# Credentials should be configured in your environment (e.g., via AWS CLI, IAM roles, or env vars)
s3_client = None
S3_BUCKET_NAME = os.environ.get("S3_BUCKET_NAME")
if not S3_BUCKET_NAME:
    print(f"S3 client initialized. CRITICAL WARNING: S3_BUCKET_NAME environment variable is not set or is empty. Operations will fail.")
    raise Exception("ERROR: No S3_BUCKET_NAME is given.")
AWS_REGION = os.environ.get("AWS_REGION")

try:
    client_args = {}
    if AWS_REGION:
        client_args['region_name'] = AWS_REGION
    
    s3_client = boto3.client("s3", **client_args)

    if s3_client:
        region_message = f" (Region: {AWS_REGION})" if AWS_REGION else " (Region: default from AWS config/env)"
        print(f"S3 client initialized. Configured to use bucket: '{S3_BUCKET_NAME}'{region_message}.")
    # No else needed here, as boto3.client() would raise an exception if it truly failed to create a client object.

except NoCredentialsError:
    print("ERROR: AWS credentials not found. Please configure your AWS credentials (e.g., AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY). s3_client remains None.")
except PartialCredentialsError:
    print("ERROR: Incomplete AWS credentials found. Please check your AWS configuration. s3_client remains None.")
except Exception as e: # Catch other boto3 client initialization errors, e.g., invalid region
    print(f"ERROR: Could not initialize S3 client: {e}. s3_client remains None.")


def extract_filename_from_s3_key(s3_key: str) -> str:
    """
    Extracts the filename (the part after the last '/') from an S3 key.
    If no '/' is present, returns the original key.

    Args:
        s3_key (str): The S3 key (e.g., "BEEHIVE/ORIGIN/image.jpg").

    Returns:
        str: The extracted filename (e.g., "image.jpg"). Returns empty string if input is None or empty.
    """
    if not s3_key: # Handles None or empty string
        return ""
    return os.path.basename(s3_key)


def get_s3_object_bytes(s3_key: str) -> bytes:
    """
    Downloads an object from the pre-configured S3 bucket and returns its content as bytes.

    Args:
        s3_key (str): The key of the object in the S3 bucket.

    Returns:
        bytes: The content of the S3 object.

    Raises:
        RuntimeError: If the S3 client is not initialized or S3_BUCKET_NAME is not configured.
        FileNotFoundError: If the object is not found in S3.
        PermissionError: If access to the S3 object is denied.
        Exception: For other S3 related errors.
    """
    if s3_client is None:
        raise RuntimeError("S3 client is not initialized. Check AWS credentials and configuration.")

    if not S3_BUCKET_NAME: # Check if S3_BUCKET_NAME is None or empty
        raise RuntimeError(
            "S3 bucket name is not configured. "
            "Please set the S3_BUCKET_NAME environment variable."
        )

    print(f"Attempting to download s3://{S3_BUCKET_NAME}/{s3_key}")
    try:
        response = s3_client.get_object(Bucket=S3_BUCKET_NAME, Key=s3_key)
        object_content = response['Body'].read()
        print(f"Successfully downloaded {len(object_content)} bytes from s3://{S3_BUCKET_NAME}/{s3_key}")
        return object_content
    except ClientError as e:
        error_code = e.response.get("Error", {}).get("Code")
        if error_code == "NoSuchKey":
            print(f"Error: Object not found in S3 - s3://{S3_BUCKET_NAME}/{s3_key}")
            raise FileNotFoundError(f"Object not found in S3: s3://{S3_BUCKET_NAME}/{s3_key}")
        elif error_code == "AccessDenied":
            print(f"Error: Access denied for S3 object - s3://{S3_BUCKET_NAME}/{s3_key}")
            raise PermissionError(f"Access denied for S3 object: s3://{S3_BUCKET_NAME}/{s3_key}")
        else:
            print(f"S3 ClientError when trying to get object {s3_key} from bucket {S3_BUCKET_NAME}: {e}")
            raise Exception(f"S3 error getting object {s3_key}: {e}")
    except Exception as e: 
        print(f"An unexpected error occurred while downloading from S3 (key: {s3_key}): {e}")
        raise


def put_s3_object_bytes(s3_key: str, object_bytes: bytes, content_type: str = 'application/octet-stream') -> str:
    """
    Uploads byte data to the pre-configured S3 bucket.

    Args:
        s3_key (str): The key under which to store the object in the S3 bucket.
        object_bytes (bytes): The byte data of the object to upload.
        content_type (str): The standard MIME type of the object. Defaults to 'application/octet-stream'.

    Returns:
        str: The full S3 path (s3://bucket/key) of the uploaded object.

    Raises:
        RuntimeError: If the S3 client is not initialized or S3_BUCKET_NAME is not configured.
        PermissionError: If access to upload to S3 is denied.
        Exception: For other S3 related errors during upload.
    """
    if s3_client is None:
        raise RuntimeError("S3 client is not initialized. Check AWS credentials and configuration.")

    if not S3_BUCKET_NAME: # Check if S3_BUCKET_NAME is None or empty
        raise RuntimeError(
            "S3 bucket name is not configured. "
            "Please set the S3_BUCKET_NAME environment variable."
        )

    full_s3_path = f"s3://{S3_BUCKET_NAME}/{s3_key}"
    print(f"Attempting to upload to {full_s3_path} ({len(object_bytes)} bytes, Content-Type: {content_type})")
    try:
        s3_client.put_object(Bucket=S3_BUCKET_NAME, Key=s3_key, Body=object_bytes, ContentType=content_type)
        print(f"Successfully uploaded {len(object_bytes)} bytes to {full_s3_path}")
        return full_s3_path
    except ClientError as e:
        error_code = e.response.get("Error", {}).get("Code")
        if error_code == "AccessDenied":
            print(f"Error: Access denied for S3 upload - {full_s3_path}")
            raise PermissionError(f"Access denied for S3 upload: {full_s3_path}")
        else:
            print(f"S3 ClientError when trying to put object {s3_key} to bucket {S3_BUCKET_NAME}: {e}")
            raise Exception(f"S3 error putting object {s3_key}: {e}")
    except Exception as e: 
        print(f"An unexpected error occurred while uploading to S3 (key: {s3_key}): {e}")
        raise

# Example of how to use this (for testing purposes)
if __name__ == "__main__":
    print("\n--- S3 Handler Module Self-Test ---")

    if not S3_BUCKET_NAME: # Check if S3_BUCKET_NAME is None or empty
        print("CRITICAL: S3_BUCKET_NAME environment variable is not set or is empty. Most tests will be skipped or will fail.")
    if s3_client is None:
        print("CRITICAL: S3 client is not initialized (check AWS credentials/config). Most tests will be skipped or will fail.")
    
    if S3_BUCKET_NAME and s3_client: # Proceed with tests only if basic config seems okay
        print(f"Using S3 Bucket: {S3_BUCKET_NAME}")

        # Test 1: Filename extraction
        print("\n--- Testing Filename Extraction ---")
        test_keys_for_extraction = [
            "BEEHIVE/ORIGIN/image1.jpg",
            "folder/subfolder/another_image.png",
            "nofolder.txt",
            "trailing/", # Edge case: key ends with a slash
            "",
            None 
        ]
        for key in test_keys_for_extraction:
            try:
                extracted = extract_filename_from_s3_key(key)
                print(f"Original: '{key}', Extracted: '{extracted}'")
            except Exception as e: # Should not happen with os.path.basename for string inputs
                print(f"Error extracting from '{key}': {e}")


        # Test 2: S3 Upload (PutObject)
        print("\n--- Testing S3 Upload (put_s3_object_bytes) ---")
        test_upload_key = "test_uploads/s3_handler_self_test_sample.txt"
        test_upload_data = f"This is a test file uploaded by s3_handler.py self-test at {__import__('datetime').datetime.now()}.".encode('utf-8')
        uploaded_s3_path = ""
        try:
            uploaded_s3_path = put_s3_object_bytes(test_upload_key, test_upload_data, content_type='text/plain')
            print(f"Upload test successful. Object accessible at: {uploaded_s3_path}")

            # Test 3: S3 Download (GetObject) - try to download what was just uploaded
            print("\n--- Testing S3 Download (get_s3_object_bytes) ---")
            try:
                downloaded_bytes = get_s3_object_bytes(test_upload_key)
                if downloaded_bytes == test_upload_data:
                    print(f"Download test successful for key: {test_upload_key}. Content matches.")
                else:
                    print(f"Download test for key: {test_upload_key}. Content MISMATCH!")
                    print(f"Expected ({len(test_upload_data)} bytes): {test_upload_data[:100]}...")
                    print(f"Got ({len(downloaded_bytes)} bytes): {downloaded_bytes[:100]}...")
            except Exception as e:
                print(f"Error during download test for '{test_upload_key}': {e}")

        except PermissionError as e:
            print(f"Upload test failed for '{test_upload_key}': {e}. Check IAM permissions for PutObject.")
        except RuntimeError as e: # Covers S3 client/config issues
            print(f"Upload test failed for '{test_upload_key}': Runtime error - {e}")
        except Exception as e:
            print(f"An error occurred during the S3 upload test for key '{test_upload_key}': {e}")
    else:
        print("Basic S3 configuration (S3_BUCKET_NAME or s3_client) is missing. Skipping detailed S3 operation tests.")
    print("\n--- End of S3 Handler Module Self-Test ---")

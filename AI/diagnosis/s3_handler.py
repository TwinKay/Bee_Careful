# This module handles interactions with a single, pre-configured AWS S3 bucket.

import os
import boto3
from botocore.exceptions import ClientError, NoCredentialsError, PartialCredentialsError
# typing.Optional is not needed for function arguments anymore
# from typing import Optional # No longer needed

# --- S3 Configuration ---
# The S3 bucket name is configured here, preferably via an environment variable.
S3_BUCKET_NAME = os.environ.get("S3_BUCKET_NAME")

# AWS region can also be configured via environment variable or AWS config files.
AWS_REGION = os.environ.get("AWS_REGION")

# Initialize S3 client
# Credentials should be configured in your environment (e.g., via AWS CLI, IAM roles, or env vars)
s3_client = None # Initialize to None
try:
    if AWS_REGION:
         s3_client = boto3.client("s3", region_name=AWS_REGION)
    # A simple check to confirm client was created (does not guarantee connectivity or correct config)
    if s3_client:
        print(f"S3 client initialized. Configured to use bucket: '{S3_BUCKET_NAME}' (Region: {AWS_REGION}).")
    else: # Should not happen if boto3.client doesn't raise an exception, but as a safeguard.
        print("ERROR: S3 client could not be initialized by boto3, but no exception was raised.")

except NoCredentialsError:
    print("ERROR: AWS credentials not found. Please configure your AWS credentials.")
    # s3_client remains None
except PartialCredentialsError:
    print("ERROR: Incomplete AWS credentials found. Please check your AWS configuration.")
    # s3_client remains None
except Exception as e: # Catch other boto3 client initialization errors
    print(f"ERROR: Could not initialize S3 client: {e}")
    # s3_client remains None


def get_s3_object_bytes(s3_key: str) -> bytes:
    """
    Downloads an object from the pre-configured S3 bucket and returns its content as bytes.

    Args:
        s3_key (str): The key of the object in the S3 bucket.

    Returns:
        bytes: The content of the S3 object.

    Raises:
        RuntimeError: If the S3 client is not initialized or bucket name is not configured.
        FileNotFoundError: If the object is not found in S3.
        PermissionError: If access to the S3 object is denied.
        Exception: For other S3 related errors.
    """
    if s3_client is None:
        raise RuntimeError("S3 client is not initialized. Check AWS credentials and configuration.")

    if not S3_BUCKET_NAME:
        raise RuntimeError(
            "S3 bucket name is not configured correctly. "
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
    except Exception as e: # Catch other unexpected errors during download
        print(f"An unexpected error occurred while downloading from S3 (key: {s3_key}): {e}")
        raise

# Example of how to use this (for testing purposes)
if __name__ == "__main__":
    # To test this, you need:
    # 1. AWS credentials configured in your environment.
    # 2. The S3_BUCKET_NAME environment variable set (or the placeholder updated).
    # 3. A file in your S3 bucket to test with.
    # Example: export S3_BUCKET_NAME="my-actual-test-bucket"
    #          export AWS_REGION="us-west-2" (optional, if not in default AWS profile region)
    #          (upload a test.txt to s3://my-actual-test-bucket/test-files/test.txt)

    if s3_client and S3_BUCKET_NAME:
        print(f"\n--- Testing S3 download from configured bucket: {S3_BUCKET_NAME} ---")
        # Replace 'test-files/test-image.jpg' with an actual key in your bucket
        test_key = "test-files/sample.jpg" # MODIFY THIS TO A VALID KEY IN YOUR BUCKET
        try:
            print(f"Attempting to download: {test_key}")
            file_bytes = get_s3_object_bytes(test_key)
            print(f"Successfully downloaded {len(file_bytes)} bytes for key '{test_key}'.")
            # Example: Save the downloaded file
            # with open("downloaded_s3_test_file.jpg", "wb") as f:
            #     f.write(file_bytes)
            # print("Test file saved as downloaded_s3_test_file.jpg")
        except FileNotFoundError:
            print(f"Test file '{test_key}' not found in bucket '{S3_BUCKET_NAME}'. Please check the key.")
        except PermissionError:
            print(f"Access denied for '{test_key}' in bucket '{S3_BUCKET_NAME}'. Check IAM permissions.")
        except RuntimeError as e: # Covers S3 client/config issues
            print(f"Runtime error during S3 test: {e}")
        except Exception as e:
            print(f"An error occurred during the S3 test for key '{test_key}': {e}")
    else:
        print("\n--- S3 Test Skipped ---")
        if not s3_client:
            print("Reason: S3 client is not initialized (check AWS credentials/config).")
        if not S3_BUCKET_NAME:
            print(f"Reason: S3_BUCKET_NAME is not properly configured.")
            print("Please set the S3_BUCKET_NAME environment variable.")

import json
import os
import urllib3 # Using urllib3 which is available in AWS Lambda environment

# Environment variables for your API endpoint
API_HOST = os.environ.get('API_HOST') # e.g., https://your-api.example.com
API_PATH = os.environ.get('API_PATH') # e.g., /api/v1/s3/events
# Optional: API Key if your endpoint is protected
API_KEY = os.environ.get('API_KEY')

http = urllib3.PoolManager()

def lambda_handler(event, context):
    """
    Handles S3 PutObject events and relays them to an external API.
    Constructs the API endpoint from API_HOST and API_PATH.
    Includes the object size in the payload.
    """
    print("Received S3 event:", json.dumps(event, indent=2))

    if not API_HOST:
        print("Error: API_HOST environment variable not set.")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'API_HOST not configured'})
        }
    if not API_PATH:
        print("Error: API_PATH environment variable not set.")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'API_PATH not configured'})
        }

    # Construct the full API endpoint
    # Ensure no double slashes if API_HOST ends with / and API_PATH starts with /
    api_endpoint = API_HOST.rstrip('/') + '/' + API_PATH.lstrip('/')
    print(f"Target API Endpoint: {api_endpoint}")

    try:
        # Extract relevant information from the S3 event
        for record in event.get('Records', []):
            s3_event = record.get('s3', {})
            bucket_name = s3_event.get('bucket', {}).get('name')
            s3_object_info = s3_event.get('object', {})
            object_key = s3_object_info.get('key')
            object_size = s3_object_info.get('size') # Get the object size

            event_time = record.get('eventTime')
            aws_region = record.get('awsRegion')
            event_name = record.get('eventName') # e.g., "ObjectCreated:Put"

            if not bucket_name or not object_key:
                print(f"Warning: Could not extract bucket name or object key from record: {json.dumps(record)}")
                continue

            # Prepare the payload to send to your API
            payload = {
                'bucketName': bucket_name,
                'objectKey': object_key,
                'objectSize': object_size, # Added object size
                'eventTime': event_time,
                'eventName': event_name,
                'awsRegion': aws_region,
            }

            print(f"Sending payload to API: {json.dumps(payload)}")

            headers = {
                'Content-Type': 'application/json'
            }
            if API_KEY:
                headers['X-API-Key'] = API_KEY # Example header for API key

            encoded_payload = json.dumps(payload).encode('utf-8')

            try:
                response = http.request(
                    'POST',
                    api_endpoint, # Use the constructed endpoint
                    body=encoded_payload,
                    headers=headers,
                    retries=urllib3.Retry(total=3, backoff_factor=0.2) # Basic retry mechanism
                )

                print(f"API Response Status: {response.status}")
                print(f"API Response Data: {response.data.decode('utf-8')}")

                if response.status >= 400:
                    # Handle API errors
                    print(f"Error calling API: Status {response.status}, Response: {response.data.decode('utf-8')}")
                    # You might want to implement more robust error handling here,
                    # like sending to a Dead Letter Queue (DLQ)
            except urllib3.exceptions.MaxRetryError as e:
                print(f"Error sending data to API after multiple retries: {str(e)}")
                # Handle persistent network issues
                raise e # This will cause Lambda to retry if configured, or go to DLQ
            except Exception as e:
                print(f"An unexpected error occurred while sending data to API: {str(e)}")
                raise e

        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Event processed and relayed successfully'})
        }

    except Exception as e:
        print(f"Error processing S3 event: {str(e)}")
        # Consider sending to DLQ or logging more detailed error information
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

# Example S3 Put Event (for testing locally, not part of Lambda deployment)
if __name__ == '__main__':
    # Mock environment variables for local testing
    from dotenv import load_dotenv
    load_dotenv()

    # Environment variables for your API endpoint
    API_HOST = os.environ.get('API_HOST') # e.g., https://your-api.example.com
    API_PATH = os.environ.get('API_PATH') # e.g., /api/v1/s3/events
    # Optional: API Key if your endpoint is protected
    API_KEY = os.environ.get('API_KEY')
      
    example_event = {
      "Records": [
        {
          "eventVersion": "2.1",
          "eventSource": "aws:s3",
          "awsRegion": "us-east-1",
          "eventTime": "2023-10-27T12:34:56.789Z",
          "eventName": "ObjectCreated:Put",
          "userIdentity": {
            "principalId": "EXAMPLE"
          },
          "requestParameters": {
            "sourceIPAddress": "127.0.0.1"
          },
          "responseElements": {
            "x-amz-request-id": "EXAMPLE123456789",
            "x-amz-id-2": "EXAMPLE123/5678abcdefghijklambdaisawesome/mnopqrstuvwxyzABCDEFGH"
          },
          "s3": {
            "s3SchemaVersion": "1.0",
            "configurationId": "testConfigRule",
            "bucket": {
              "name": "my-example-bucket-us-east-1",
              "ownerIdentity": {
                "principalId": "EXAMPLE"
              },
              "arn": "arn:aws:s3:::my-example-bucket-us-east-1"
            },
            "object": {
              "key": "photos/happyface.jpg",
              "size": 1024, # This is the file size in bytes
              "eTag": "0123456789abcdef0123456789abcdef",
              "sequencer": "0A1B2C3D4E5F678901"
            }
          }
        }
      ]
    }
    lambda_handler(example_event, None)

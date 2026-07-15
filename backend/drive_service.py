import io
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload
from google.oauth2.credentials import Credentials

def get_drive_service(credentials: Credentials):
    """
    Builds and returns the Google Drive v3 API client.
    """
    return build('drive', 'v3', credentials=credentials)

def get_or_create_drive_folder(drive_service) -> str:
    """
    Finds or creates the designated 'AI Document Analyzer' application folder in the user's Google Drive.
    """
    try:
        # Search for folder in the user's Drive
        query = "mimeType = 'application/vnd.google-apps.folder' and name = 'AI Document Analyzer' and trashed = false"
        response = drive_service.files().list(
            q=query,
            fields="files(id, name)",
            spaces="drive"
        ).execute()
        
        folders = response.get('files', [])
        if folders:
            return folders[0]['id']
            
        # Create folder if it doesn't exist
        folder_metadata = {
            'name': 'AI Document Analyzer',
            'mimeType': 'application/vnd.google-apps.folder'
        }
        folder = drive_service.files().create(
            body=folder_metadata,
            fields='id'
        ).execute()
        
        return folder.get('id')
    except Exception as e:
        print(f"Error checking/creating Google Drive folder: {e}")
        raise e

def upload_file_to_drive(credentials: Credentials, filename: str, content_type: str, file_bytes: bytes) -> dict:
    """
    Streams a file's binary content directly to the user's designated Google Drive folder.
    """
    drive_service = get_drive_service(credentials)
    folder_id = get_or_create_drive_folder(drive_service)
    
    file_metadata = {
        'name': filename,
        'parents': [folder_id]
    }
    
    # Wrap bytes in a file-like stream
    file_stream = io.BytesIO(file_bytes)
    media = MediaIoBaseUpload(file_stream, mimetype=content_type, resumable=True)
    
    file_response = drive_service.files().create(
        body=file_metadata,
        media_body=media,
        fields='id, name, webViewLink'
    ).execute()
    
    return {
        "id": file_response.get("id"),
        "name": file_response.get("name"),
        "webViewLink": file_response.get("webViewLink")
    }

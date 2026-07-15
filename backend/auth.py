import requests
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from google.oauth2.credentials import Credentials

security_scheme = HTTPBearer()

def get_access_token(cred: HTTPAuthorizationCredentials = Depends(security_scheme)) -> str:
    """
    Extracts the Bearer access token from the request Authorization header.
    """
    if not cred:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header"
        )
    return cred.credentials

def get_google_user(access_token: str = Depends(get_access_token)) -> dict:
    """
    Validates the access token against Google UserInfo API and returns the user profile.
    """
    try:
        url = "https://www.googleapis.com/oauth2/v3/userinfo"
        headers = {"Authorization": f"Bearer {access_token}"}
        response = requests.get(url, headers=headers)
        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired Google Access Token"
            )
        return response.json()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Google authentication failed: {str(e)}"
        )

def get_google_credentials(access_token: str = Depends(get_access_token)) -> Credentials:
    """
    Constructs a google-auth Credentials object using the verified access token.
    Can be used directly with googleapiclient.discovery.build.
    """
    return Credentials(token=access_token)

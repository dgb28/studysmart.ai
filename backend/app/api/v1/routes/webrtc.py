from fastapi import APIRouter, Depends, HTTPException
import os

try:
    from livekit.api import AccessToken, VideoGrants
except ModuleNotFoundError:  # Optional dependency in local/dev setups.
    AccessToken = None
    VideoGrants = None
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()

LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY", "devkey")
LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET", "secret")

@router.get("/token")
async def get_token(room: str, user: User = Depends(get_current_user)):
    """Generate a LiveKit token for joining a study room."""
    if AccessToken is None or VideoGrants is None:
        raise HTTPException(
            status_code=503,
            detail="LiveKit support is not installed on the backend. Install `livekit` to enable room tokens.",
        )

    participant_name = user.full_name or user.email
    
    grant = VideoGrants(
        room_join=True,
        room=room,
        can_publish=True,
        can_subscribe=True,
        can_publish_data=True,
        # FORCE MUTE AT SOURCE (Mics Off Decorum)
        can_publish_sources=["camera"] 
    )
    
    token = AccessToken(
        LIVEKIT_API_KEY,
        LIVEKIT_API_SECRET
    ).with_grants(grant).with_identity(str(user.id)).with_name(participant_name)
    
    return {"token": token.to_jwt()}

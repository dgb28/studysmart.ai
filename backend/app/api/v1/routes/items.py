"""Items routes — replace with your core domain entity."""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db

router = APIRouter()


@router.get("/")
async def list_items(db: AsyncSession = Depends(get_db)):
    """List items. TODO: replace 'items' with your domain entity."""
    return {"message": "list items — implement me"}


@router.post("/")
async def create_item(db: AsyncSession = Depends(get_db)):
    """Create item. TODO: implement."""
    return {"message": "create item — implement me"}


@router.get("/{item_id}")
async def get_item(item_id: str, db: AsyncSession = Depends(get_db)):
    """Get item. TODO: implement."""
    return {"item_id": item_id, "message": "get item — implement me"}


@router.put("/{item_id}")
async def update_item(item_id: str, db: AsyncSession = Depends(get_db)):
    """Update item. TODO: implement."""
    return {"item_id": item_id, "message": "update item — implement me"}


@router.delete("/{item_id}")
async def delete_item(item_id: str, db: AsyncSession = Depends(get_db)):
    """Delete item. TODO: implement."""
    return {"item_id": item_id, "message": "delete item — implement me"}

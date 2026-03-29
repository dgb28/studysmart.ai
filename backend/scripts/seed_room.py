import asyncio
from app.db.session import AsyncSessionLocal
from app.models.study_room import StudyRoom
from sqlalchemy import select

async def seed():
    async with AsyncSessionLocal() as session:
        # Check if exists
        result = await session.execute(select(StudyRoom).where(StudyRoom.name == 'main-lounge'))
        room = result.scalar_one_or_none()
        if not room:
            room = StudyRoom(
                name='main-lounge', 
                description='Global deep work lounge for everyone.',
                max_participants=50,
                tags=['Deep Work', 'Silent', 'Global']
            )
            session.add(room)
            await session.commit()
            print('Room "main-lounge" seeded successfully.')
        else:
            print('Room "main-lounge" already exists.')

if __name__ == '__main__':
    asyncio.run(seed())

import asyncio
import sys
import os
import uuid
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

# Add backend directory to sys.path so we can import from app
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.core.config import settings
from app.db.base import Base # Needed so tables are created if not exist
from app.models.subject import Subject
from app.models.module import Module
from app.models.topic import Topic
from app.models.user import User

async def seed_data():
    print("Connecting to DB...")
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    
    print("Creating tables if they do not exist...")
    async with engine.begin() as conn:
        # Since we just added new models, we'll force creation if Alembic isn't run yet.
        await conn.run_sync(Base.metadata.create_all)
        
    AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with AsyncSessionLocal() as db:
        print("Seeding default user for testing...")
        mock_user_id = uuid.UUID("00000000-0000-0000-0000-000000000000")
        user = User(
            id=mock_user_id,
            email="test@studypulse.com",
            hashed_password="hashed_mock",
            full_name="Test Student",
            is_active=True
        )
        db.add(user)

        print("Seeding subjects...")
        sql_subject = Subject(
            id=uuid.uuid4(),
            name="SQL Mastery",
            icon="Database",
            color="bg-blue-600",
            description="Learn SQL from zero to hero."
        )
        dsa_subject = Subject(
            id=uuid.uuid4(),
            name="Algorithms (DSA)",
            icon="Binary",
            color="bg-purple-600",
            description="Master common data structures and algorithms."
        )
        db.add_all([sql_subject, dsa_subject])
        await db.flush() # get IDs
        
        print("Seeding modules...")
        sql_mod1 = Module(id=uuid.uuid4(), subject_id=sql_subject.id, title="Basics of SELECT", description="Learn how to query data.", order=1)
        sql_mod2 = Module(id=uuid.uuid4(), subject_id=sql_subject.id, title="Joins & Relations", description="Connecting tables.", order=2)
        dsa_mod1 = Module(id=uuid.uuid4(), subject_id=dsa_subject.id, title="Arrays & Strings", description="Fundamental structures.", order=1)
        
        db.add_all([sql_mod1, sql_mod2, dsa_mod1])
        await db.flush()

        print("Seeding topics...")
        t1 = Topic(module_id=sql_mod1.id, title="SELECT * FROM table", content="The `SELECT` statement is used to select data from a database. The data returned is stored in a result table, called the result-set.", order=1)
        t2 = Topic(module_id=sql_mod1.id, title="WHERE clause", content="The `WHERE` clause is used to filter records. It is used to extract only those records that fulfill a specified condition.", order=2)
        t3 = Topic(module_id=sql_mod1.id, title="ORDER BY", content="The `ORDER BY` keyword is used to sort the result-set in ascending or descending order.", order=3)
        
        t4 = Topic(module_id=dsa_mod1.id, title="What is an Array?", content="An array is a data structure consisting of a collection of elements, each identified by at least one array index or key.", order=1)
        t5 = Topic(module_id=dsa_mod1.id, title="Two Pointers Technique", content="Two pointers is really an easy and effective technique which is typically used for searching pairs in a sorted array.", order=2)
        
        db.add_all([t1, t2, t3, t4, t5])
        
        await db.commit()
        print("Data seeded successfully!")

if __name__ == "__main__":
    asyncio.run(seed_data())

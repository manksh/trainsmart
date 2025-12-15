"""
Main seed script to set up initial data.

Run with: python -m app.seeds.seed_all
"""

import asyncio
import os
from sqlalchemy import select
from app.database import async_session_maker
from app.models.user import User
from app.utils.security import hash_password
from app.seeds.assessment_seed import seed_assessment


async def seed_superadmin():
    """Create initial SuperAdmin user if doesn't exist."""
    email = os.getenv("SUPERADMIN_EMAIL", "admin@trainsmart.app")
    password = os.getenv("SUPERADMIN_PASSWORD", "supersecret123")

    async with async_session_maker() as session:
        # Check if superadmin exists
        result = await session.execute(
            select(User).where(User.email == email)
        )
        existing = result.scalar_one_or_none()

        if existing:
            print(f"SuperAdmin already exists: {email}")
            return existing.id

        # Create superadmin
        user = User(
            email=email,
            password_hash=hash_password(password),
            first_name="Super",
            last_name="Admin",
            is_superadmin=True,
            is_active=True,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        print(f"Created SuperAdmin: {email}")
        print(f"Password: {password}")
        return user.id


async def main():
    """Run all seeds."""
    print("=" * 50)
    print("TrainSmart Database Seeding")
    print("=" * 50)

    print("\n1. Seeding SuperAdmin user...")
    await seed_superadmin()

    print("\n2. Seeding Assessment data...")
    await seed_assessment()

    print("\n" + "=" * 50)
    print("Seeding complete!")
    print("=" * 50)


if __name__ == "__main__":
    asyncio.run(main())

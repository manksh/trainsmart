from fastapi import APIRouter

from app.api.v1 import auth, users, organizations, invites, assessments

api_router = APIRouter()

# Include routers
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(organizations.router, prefix="/organizations", tags=["organizations"])
api_router.include_router(invites.router, prefix="/invites", tags=["invites"])
api_router.include_router(assessments.router, prefix="/assessments", tags=["assessments"])


@api_router.get("/")
async def root():
    return {"message": "TrainSmart API v1"}

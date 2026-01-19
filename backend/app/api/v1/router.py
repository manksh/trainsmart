from fastapi import APIRouter

from app.api.v1 import auth, users, organizations, invites, assessments, checkins, journals, training_modules, coaching_tips, password_reset

api_router = APIRouter()

# Include routers
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(password_reset.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(organizations.router, prefix="/organizations", tags=["organizations"])
api_router.include_router(invites.router, prefix="/invites", tags=["invites"])
api_router.include_router(assessments.router, prefix="/assessments", tags=["assessments"])
api_router.include_router(checkins.router, prefix="/checkins", tags=["checkins"])
api_router.include_router(journals.router, prefix="/journals", tags=["journals"])
api_router.include_router(training_modules.router, prefix="/training-modules", tags=["training-modules"])
api_router.include_router(coaching_tips.router, prefix="/coaching-tips", tags=["coaching-tips"])


@api_router.get("/")
async def root():
    return {"message": "CTLST Labs API v1"}

from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, UserResponse, CurrentUserResponse, ForgotPasswordRequest, ResetPasswordRequest, ProfileUpdateRequest, ChangePasswordRequest
from app.services.auth_service import register, authenticate, create_token, send_reset_email, reset_password, update_profile, change_password
from app.utils.security import decode_token
from app.models.user import User


router = APIRouter(prefix="/api/auth", tags=["auth"])
users_router = APIRouter(prefix="/api/users", tags=["users"])


@router.post("/register", response_model=TokenResponse)
def register_user(data: RegisterRequest, db: Session = Depends(get_db)):
    if not data.passwords_match():
        raise HTTPException(status_code=400, detail="Passwords do not match")
    user = register(db, data.name, data.email, data.password)
    token = create_token(user)
    return TokenResponse(
        access_token=token,
        user=UserResponse(id=user.id, name=user.name, email=user.email)
    )


@router.post("/login", response_model=TokenResponse)
def login_user(data: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate(db, data.email, data.password)
    token = create_token(user)
    return TokenResponse(
        access_token=token,
        user=UserResponse(id=user.id, name=user.name, email=user.email)
    )


@router.post("/logout")
def logout_user():
    # Client-side logout (token invalidation would need a blocklist in production)
    return {"detail": "Logged out successfully"}


@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    send_reset_email(db, data.email)
    return {"detail": "If the email exists, a reset link has been sent"}


@router.post("/reset-password")
def reset_password_endpoint(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    reset_password(db, data.token, data.password, data.confirm_password)
    return {"detail": "Password has been reset successfully"}


@router.get("/me", response_model=CurrentUserResponse)
def get_current_user(
    authorization: str = Header(default=None),
    db: Session = Depends(get_db),
):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ")[1]
    payload = decode_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = db.query(User).filter(User.id == int(payload["sub"])).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return CurrentUserResponse(id=user.id, name=user.name, email=user.email)


@router.put("/profile", response_model=CurrentUserResponse)
def update_profile_endpoint(data: ProfileUpdateRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user = update_profile(db, current_user, data.name, str(data.email))
    return CurrentUserResponse(id=user.id, name=user.name, email=user.email)


@router.put("/password")
def change_password_endpoint(data: ChangePasswordRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    change_password(db, current_user, data.current_password, data.new_password)
    return {"detail": "Password changed successfully"}


@users_router.get("/me", response_model=CurrentUserResponse)
def get_user_profile(current_user: User = Depends(get_current_user)):
    return CurrentUserResponse(id=current_user.id, name=current_user.name, email=current_user.email)
from datetime import timedelta
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from fastapi import HTTPException
from app.models.user import User
from app.schemas.auth import RegisterRequest
from app.utils.security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_token,
)
from app.config import settings


def register(db: Session, name: str, email: str, password: str):
    try:
        if db.query(User).filter(User.email == email).first():
            raise HTTPException(status_code=400, detail="Email already registered")

        user = User(name=name, email=email, password_hash=hash_password(password))
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    except HTTPException:
        db.rollback()
        raise
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Email already registered")
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=500, detail="Unable to register user")
    except Exception:
        db.rollback()
        raise


def authenticate(db: Session, email: str, password: str) -> User:
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    return user


def update_profile(db: Session, user: User, name: str, email: str) -> User:
    existing = db.query(User).filter(User.email == email, User.id != user.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user.name = name
    user.email = email
    try:
        db.commit()
        db.refresh(user)
        return user
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Email already registered")
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=500, detail="Unable to update profile")


def change_password(db: Session, user: User, current_password: str, new_password: str) -> None:
    if not verify_password(current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    user.password_hash = hash_password(new_password)
    try:
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=500, detail="Unable to change password")


def create_token(user: User) -> str:
    return create_access_token({"sub": str(user.id)})


def create_reset_token(user: User) -> str:
    """Create a short-lived JWT specifically for password reset."""
    return create_access_token(
        {"sub": str(user.id), "purpose": "password_reset"},
        expires_delta=timedelta(minutes=30),
    )


def send_reset_email(db: Session, email: str) -> None:
    """Generate a reset token and, when no SMTP is configured, print the
    development reset link to the server logs for the SIH demo flow."""
    user = db.query(User).filter(User.email == email).first()
    # Do not leak whether an account exists; always behave identically.
    if user is None:
        return

    token = create_reset_token(user)

    if settings.ENVIRONMENT in {"development", "test"}:
        # No SMTP server in the SIH demo environment; surface the link in logs.
        reset_link = f"{settings.FRONTEND_URL}/forgot-password?token={token}"
        import logging
        logging.getLogger("satquery.auth").info(
            "Password reset link (development): %s", reset_link
        )
    else:
        # In production you would send an email here via your email provider.
        # Implement by plugging in an SMTP client / transactional email service.
        raise HTTPException(status_code=501, detail="Email sending is not configured")


def reset_password(db: Session, token: str, password: str, confirm_password: str) -> None:
    if password != confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    payload = decode_token(token)
    if not payload or payload.get("purpose") != "password_reset":
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    user = db.query(User).filter(User.id == int(payload["sub"])).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.password_hash = hash_password(password)
    db.commit()
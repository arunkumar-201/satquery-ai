#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
SATQUERY AI — Demo Seed Script
Creates demo user, project, images, and analysis data for SIH demonstration.

Run from project root: python backend/scripts/seed_demo.py
"""

import sys
import os
from pathlib import Path
from datetime import datetime, timedelta

# Add backend to path so we can import app modules
BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from sqlalchemy.orm import Session
from app.database import engine, Base, SessionLocal
from app.models.user import User
from app.models.project import Project
from app.models.image import Image, ModalityEnum
from app.models.chat import ChatSession, ChatMessage, MessageRoleEnum
from app.models.analysis import AnalysisResult
from app.utils.security import hash_password


def seed_demo_data() -> None:
    """Create demo data for SIH demonstration."""
    db: Session = SessionLocal()
    try:
        # Ensure tables exist
        Base.metadata.create_all(bind=engine)

        # 1. Demo User
        demo_email = "demo@satquery.ai"
        demo_name = "Demo User"
        demo_password = "demopassword123"

        user = db.query(User).filter(User.email == demo_email).first()
        if not user:
            user = User(
                name=demo_name,
                email=demo_email,
                password_hash=hash_password(demo_password),
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"[OK] Created demo user: {demo_email} (password: {demo_password})")
        else:
            print(f"[INFO] Demo user already exists: {demo_email}")

        # 2. Demo Project - "Urban Growth Analysis – Visakhapatnam" (per SIH demo flow)
        project_name = "Urban Growth Analysis – Visakhapatnam"
        project_desc = (
            "Demo project for SIH 2026: Multi-temporal satellite analysis of urban "
            "expansion in Visakhapatnam using optical imagery. Upload your own "
            "before/after images to run change detection."
        )

        project = db.query(Project).filter(
            Project.user_id == user.id,
            Project.name == project_name
        ).first()

        if not project:
            project = Project(
                user_id=user.id,
                name=project_name,
                description=project_desc,
            )
            db.add(project)
            db.commit()
            db.refresh(project)
            print(f"[OK] Created demo project: {project_name}")
        else:
            print(f"[INFO]  Demo project already exists: {project_name}")

        # 3. Demo Images (placeholder entries - user must upload real images)
        demo_images = [
            {
                "filename": "visakhapatnam_2023_optical.tif",
                "file_url": "/uploads/visakhapatnam_2023_optical.tif",
                "modality": ModalityEnum.OPTICAL,
                "sensor": "Sentinel-2",
                "acquisition_date": datetime(2023, 3, 15, 10, 30),
                "latitude": 17.6868,
                "longitude": 83.2185,
                "resolution": 10.0,
            },
            {
                "filename": "visakhapatnam_2024_optical.tif",
                "file_url": "/uploads/visakhapatnam_2024_optical.tif",
                "modality": ModalityEnum.OPTICAL,
                "sensor": "Sentinel-2",
                "acquisition_date": datetime(2024, 3, 15, 10, 30),
                "latitude": 17.6868,
                "longitude": 83.2185,
                "resolution": 10.0,
            },
        ]

        for img_data in demo_images:
            existing = db.query(Image).filter(
                Image.project_id == project.id,
                Image.filename == img_data["filename"]
            ).first()
            if not existing:
                img = Image(project_id=project.id, **img_data)
                db.add(img)
        db.commit()
        print(f"[OK] Created {len(demo_images)} demo image entries (placeholders)")

        # 4. Demo Chat Session
        session_name = "Urban Growth Analysis Chat"
        session = db.query(ChatSession).filter(
            ChatSession.project_id == project.id,
            ChatSession.user_id == user.id
        ).first()

        if not session:
            session = ChatSession(
                user_id=user.id,
                project_id=project.id,
                language="en",
            )
            db.add(session)
            db.commit()
            db.refresh(session)
            print(f"[OK] Created demo chat session")
        else:
            print(f"[INFO]  Demo chat session already exists")

        # 5. Demo Chat Messages (conversation history)
        demo_messages = [
            {
                "role": MessageRoleEnum.USER,
                "message": "What is visible in this image?",
                "language": "en",
            },
            {
                "role": MessageRoleEnum.ASSISTANT,
                "message": "The satellite image shows Visakhapatnam urban area with coastal features, "
                           "built-up regions, vegetation, and water bodies. The image appears to be "
                           "optical imagery with 10m resolution from Sentinel-2.",
                "language": "en",
            },
            {
                "role": MessageRoleEnum.USER,
                "message": "Where are the buildings?",
                "language": "en",
            },
            {
                "role": MessageRoleEnum.ASSISTANT,
                "message": "Building detection requires real AI model integration. In demo mode, "
                           "the system returns [DEMO ANALYSIS] labeled responses. Configure a real "
                           "AI provider (Gemini/OpenAI-compatible) to get actual object detection.",
                "language": "en",
            },
        ]

        for msg_data in demo_messages:
            existing = db.query(ChatMessage).filter(
                ChatMessage.session_id == session.id,
                ChatMessage.message == msg_data["message"]
            ).first()
            if not existing:
                msg = ChatMessage(session_id=session.id, **msg_data)
                db.add(msg)
        db.commit()
        print(f"[OK] Created {len(demo_messages)} demo chat messages")

        # 6. Demo Analysis Results
        demo_analyses = [
            {
                "analysis_type": "IMAGE_CAPTIONING",
                "answer": "The satellite image shows Visakhapatnam urban area with coastal features, "
                          "built-up regions, vegetation, and water bodies. The image appears to be "
                          "optical imagery with 10m resolution from Sentinel-2.",
                "confidence": 0.85,
                "metadata": {"evidence": {}, "model": "demo", "images_analyzed": 1},
            },
            {
                "analysis_type": "OBJECT_DETECTION",
                "answer": "Building detection requires real AI model integration. In demo mode, "
                          "the system returns [DEMO ANALYSIS] labeled responses. Configure a real "
                          "AI provider (Gemini/OpenAI-compatible) to get actual object detection.",
                "confidence": 0.0,
                "metadata": {"evidence": {"boxes": []}, "model": "demo", "images_analyzed": 1},
            },
            {
                "analysis_type": "CHANGE_DETECTION",
                "answer": "Baseline change detection between 2023 and 2024 images shows "
                          "urban expansion in the northern and western regions. New built-up "
                          "areas detected. [BASELINE CHANGE DETECTION - NOT A TRAINED MODEL]",
                "confidence": 0.72,
                "metadata": {
                    "evidence": {
                        "change_regions": [],
                        "change_map_url": "/evidence/change_map_demo.png"
                    },
                    "model": "baseline_pixel_diff",
                    "images_analyzed": 2,
                },
            },
        ]

        for ana_data in demo_analyses:
            existing = db.query(AnalysisResult).filter(
                AnalysisResult.project_id == project.id,
                AnalysisResult.analysis_type == ana_data["analysis_type"]
            ).first()
            if not existing:
                ana = AnalysisResult(
                    project_id=project.id,
                    query_id=None,
                    **ana_data
                )
                db.add(ana)
        db.commit()
        print(f"[OK] Created {len(demo_analyses)} demo analysis results")

        print("\n" + "=" * 60)
        print("[SUCCESS] Demo seed completed successfully!")
        print("=" * 60)
        print(f"Demo User: {demo_email}")
        print(f"Password:  {demo_password}")
        print(f"Project:   {project_name}")
        print(f"Images:    2 placeholder entries (upload real images to analyze)")
        print(f"Chat:      1 session with 4 messages")
        print(f"Analyses:  3 demo results (caption, detection, change)")
        print("\nTo use:")
        print("  1. Start backend: python -m uvicorn app.main:app --app-dir backend --reload")
        print("  2. Start frontend: cd frontend && npm run dev")
        print("  3. Login with demo@satquery.ai / demopassword123")
        print("  4. Upload real satellite images to replace placeholders")
        print("  5. Run analysis on uploaded images")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Error seeding demo data: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_demo_data()
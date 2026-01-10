"""Projects API router."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Project
from app.schemas import ProjectCreate, ProjectResponse

router = APIRouter(prefix="/projects", tags=["projects"])


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(project_data: ProjectCreate, db: Session = Depends(get_db)):
    """Create a new project.

    Args:
        project_data: Project creation data
        db: Database session

    Returns:
        Created project
    """
    project = Project(
        name=project_data.name,
        address=project_data.address,
        builder=project_data.builder,
        foundation_type=project_data.foundation_type,
        floors=project_data.floors,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: str, db: Session = Depends(get_db)):
    """Get project by ID.

    Args:
        project_id: Project UUID
        db: Database session

    Returns:
        Project
    """
    from uuid import UUID
    try:
        project_uuid = UUID(project_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid project ID format"
        )

    project = db.query(Project).filter(Project.id == project_uuid).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project {project_id} not found"
        )
    return project

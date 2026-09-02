from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.roles import CONTENT_MANAGER_ROLES
from app.core.security import get_current_user, require_role
from app.db.database import get_db
from app.db.models.user import User
from app.schemas.learning import (
    LearningModuleCreate,
    LearningModuleUpdate,
    LearningModuleResponse,
    LearningProgressResponse,
    LearningProgressUpdate,
    LearningResourceCreate,
    LearningResourceResponse,
    LearningResourceUpdate,
)
from app.services.learning_service import (
    create_learning_module,
    create_learning_resource,
    delete_learning_module,
    delete_learning_resource,
    get_learning_module,
    get_learning_modules,
    get_learning_resources,
    get_my_learning_progress,
    get_my_roadmap,
    start_learning_progress,
    update_learning_module,
    update_learning_resource,
    update_learning_progress,
)


router = APIRouter(
    prefix="/api/learning",
    tags=["Learning"],
)


@router.post(
    "/modules",
    response_model=LearningModuleResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_new_learning_module(
    module_data: LearningModuleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(*CONTENT_MANAGER_ROLES)),
):
    try:
        return create_learning_module(
            db,
            module_data,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc


@router.put(
    "/modules/{module_id}",
    response_model=LearningModuleResponse,
)
def edit_learning_module(
    module_id: int,
    module_data: LearningModuleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(*CONTENT_MANAGER_ROLES)),
):
    try:
        return update_learning_module(db, module_id, module_data)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.delete(
    "/modules/{module_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_learning_module(
    module_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(*CONTENT_MANAGER_ROLES)),
):
    try:
        delete_learning_module(db, module_id)
    except ValueError as exc:
        code = status.HTTP_409_CONFLICT if "progress" in str(exc).lower() else status.HTTP_404_NOT_FOUND
        raise HTTPException(status_code=code, detail=str(exc)) from exc
    return None


@router.get(
    "/modules/{module_id}/resources",
    response_model=list[LearningResourceResponse],
)
def list_module_resources(
    module_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if get_learning_module(db, module_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Learning module not found")
    return get_learning_resources(db, module_id)


@router.post(
    "/modules/{module_id}/resources",
    response_model=LearningResourceResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_module_resource(
    module_id: int,
    resource_data: LearningResourceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(*CONTENT_MANAGER_ROLES)),
):
    try:
        return create_learning_resource(db, module_id, resource_data)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.put(
    "/resources/{resource_id}",
    response_model=LearningResourceResponse,
)
def edit_module_resource(
    resource_id: int,
    resource_data: LearningResourceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(*CONTENT_MANAGER_ROLES)),
):
    try:
        return update_learning_resource(db, resource_id, resource_data)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.delete(
    "/resources/{resource_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_module_resource(
    resource_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(*CONTENT_MANAGER_ROLES)),
):
    try:
        delete_learning_resource(db, resource_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    return None


@router.get(
    "/modules",
    response_model=list[LearningModuleResponse],
)
def list_learning_modules(
    competency_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_learning_modules(
        db,
        competency_id,
    )


@router.get(
    "/modules/{module_id}",
    response_model=LearningModuleResponse,
)
def get_single_learning_module(
    module_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    module = get_learning_module(
        db,
        module_id,
    )

    if module is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Learning module not found",
        )

    return module


@router.post(
    "/modules/{module_id}/progress",
    response_model=LearningProgressResponse,
    status_code=status.HTTP_201_CREATED,
)
def start_my_learning_progress(
    module_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return start_learning_progress(
            db,
            current_user.id,
            module_id,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc


@router.put(
    "/modules/{module_id}/progress",
    response_model=LearningProgressResponse,
)
def update_my_learning_progress(
    module_id: int,
    progress_data: LearningProgressUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return update_learning_progress(
            db,
            current_user.id,
            module_id,
            progress_data,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.get(
    "/progress/me",
    response_model=list[LearningProgressResponse],
)
def get_my_progress(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_my_learning_progress(
        db,
        current_user.id,
    )


@router.get(
    "/roadmap/me",
)
def get_my_learning_roadmap(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_my_roadmap(
        db,
        current_user.id,
    )
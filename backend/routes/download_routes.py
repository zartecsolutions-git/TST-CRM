from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
import os

router = APIRouter()

@router.get("/download/project-zip")
async def download_project_zip():
    """Download the CRM project zip file"""
    file_path = "/app/crm-project.zip"
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Zip file not found")
    
    return FileResponse(
        path=file_path,
        filename="crm-project.zip",
        media_type="application/zip",
        headers={
            "Content-Disposition": "attachment; filename=crm-project.zip"
        }
    )

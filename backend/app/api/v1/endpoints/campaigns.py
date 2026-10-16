from fastapi import APIRouter, status

from app.api.deps import CampaignServiceDep
from app.schemas.campaign import CampaignCreate, CampaignDetail, CampaignRead

router = APIRouter(prefix="/campaigns", tags=["campaigns"])


@router.get("", response_model=list[CampaignRead])
async def list_campaigns(service: CampaignServiceDep):
    return await service.list_all()


@router.post("", response_model=CampaignRead, status_code=status.HTTP_201_CREATED)
async def create_campaign(data: CampaignCreate, service: CampaignServiceDep):
    return await service.create(data)


@router.get("/{campaign_id}", response_model=CampaignDetail)
async def get_campaign(campaign_id: int, service: CampaignServiceDep):
    return await service.detail(campaign_id)


@router.post("/{campaign_id}/cancel", response_model=CampaignRead)
async def cancel_campaign(campaign_id: int, service: CampaignServiceDep):
    return await service.cancel(campaign_id)

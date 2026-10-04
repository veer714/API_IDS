"""
Pydantic Request Schemas for API Sentinel ML Service
"""

from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict


class PredictionRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    timestamp: Optional[str] = Field(default=None, description="ISO-8601 timestamp of request event")
    source_ip: str = Field(default="127.0.0.1", description="Client source IP address")
    method: str = Field(default="GET", description="HTTP request method (GET, POST, PUT, DELETE, etc.)")
    endpoint: str = Field(default="/", description="Target URI endpoint path")
    status_code: int = Field(default=200, ge=100, le=599, description="HTTP response status code")
    response_time: float = Field(default=25.0, ge=0.0, description="Server response latency in milliseconds")
    request_size: int = Field(default=100, ge=0, description="Request size in bytes")
    response_size: int = Field(default=500, ge=0, description="Response size in bytes")
    user_agent: Optional[str] = Field(default="", description="Client User-Agent header string")
    authentication_status: Optional[str] = Field(
        default="UNAUTHENTICATED",
        description="AUTHENTICATED, UNAUTHENTICATED, or FAILED",
    )
    user_id: Optional[str] = Field(default=None, description="Client or user identifier if known")
    requests_per_minute: Optional[float] = Field(
        default=None, ge=0.0, description="Requests from this IP in the past 60s (calculated dynamically if omitted)"
    )
    failed_requests: Optional[float] = Field(
        default=None, ge=0.0, description="Failed requests in past 5m (calculated dynamically if omitted)"
    )
    unique_endpoints: Optional[float] = Field(
        default=None, ge=0.0, description="Unique endpoints visited in past 5m (calculated dynamically if omitted)"
    )
    payload: Optional[str] = Field(
        default="", description="Query string parameters or serialized JSON body content"
    )


class BatchPredictionRequest(BaseModel):
    requests: List[PredictionRequest] = Field(..., min_length=1, max_length=500)

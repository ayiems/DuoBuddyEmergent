#!/usr/bin/env python3
"""
Proxy server that forwards /api requests to the Ruby backend
This allows Kubernetes ingress to route to port 8001 as expected
"""
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
import httpx
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="DuoBuddy Proxy API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Ruby backend handles CORS more strictly
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ruby backend URL
RUBY_BACKEND_URL = "http://localhost:5050"

@app.api_route("/api/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
async def proxy_to_ruby(path: str, request: Request):
    """
    Proxy all /api/* requests to the Ruby backend on port 5050
    """
    # Construct the target URL
    target_url = f"{RUBY_BACKEND_URL}/api/{path}"
    
    # Get query parameters
    query_params = dict(request.query_params)
    
    # Get headers (excluding host)
    headers = dict(request.headers)
    headers.pop("host", None)
    
    # Get body if present
    body = None
    if request.method in ["POST", "PUT", "PATCH"]:
        body = await request.body()
    
    logger.info(f"Proxying {request.method} {target_url}")
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Forward the request to Ruby backend
            response = await client.request(
                method=request.method,
                url=target_url,
                params=query_params,
                headers=headers,
                content=body,
            )
            
            # Return the response from Ruby backend
            return Response(
                content=response.content,
                status_code=response.status_code,
                headers=dict(response.headers),
            )
    except Exception as e:
        logger.error(f"Proxy error: {str(e)}")
        return Response(
            content=f'{{"error": "Proxy error: {str(e)}"}}',
            status_code=500,
            media_type="application/json"
        )

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "service": "duobuddy-proxy"}

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "DuoBuddy Proxy API",
        "version": "1.0.0",
        "backend": RUBY_BACKEND_URL
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)

from slowapi import Limiter
from slowapi.util import get_remote_address

# Shared limiter instance. Attached to app.state in main.py; imported by routers
# that need per-route limits.
limiter = Limiter(key_func=get_remote_address, default_limits=["60/minute"])

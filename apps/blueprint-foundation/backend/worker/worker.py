"""RQ Worker entry point."""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from rq import Worker
from app.queue import redis_conn

if __name__ == '__main__':
    # Start worker
    worker = Worker(['blueprints'], connection=redis_conn)
    print("Starting RQ worker for queue: blueprints")
    worker.work()

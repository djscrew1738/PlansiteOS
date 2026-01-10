"""Redis Queue (RQ) configuration."""
from redis import Redis
from rq import Queue
from app.config import settings


# Parse Redis URL
redis_conn = Redis.from_url(settings.redis_url)

# Create queue
task_queue = Queue("blueprints", connection=redis_conn)


def enqueue_task(func, *args, **kwargs):
    """Enqueue a task for background processing.

    Args:
        func: Function to execute
        *args: Positional arguments
        **kwargs: Keyword arguments

    Returns:
        RQ Job instance
    """
    job = task_queue.enqueue(func, *args, **kwargs)
    return job

import os
import redis
from rq import Worker, Queue, Connection
from .config import settings


def run_worker():
    redis_conn = redis.Redis.from_url(settings.redis_url)
    with Connection(redis_conn):
        worker = Worker([Queue("uploads")])
        worker.work(with_scheduler=True)


if __name__ == "__main__":
    run_worker()

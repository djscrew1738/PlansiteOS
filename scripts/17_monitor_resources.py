#!/usr/bin/env python3
import psutil

cpu = psutil.cpu_percent(interval=5)
mem = psutil.virtual_memory().percent

if cpu > 90 or mem > 90:
    print(f"Warning: high resource usage CPU={cpu}% MEM={mem}%")

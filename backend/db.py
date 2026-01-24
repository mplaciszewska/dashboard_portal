from psycopg2.pool import SimpleConnectionPool
import os
import time
from dotenv import load_dotenv

load_dotenv()
dbname = os.getenv("POSTGRES_DB")
user = os.getenv("POSTGRES_USER")
password = os.getenv("POSTGRES_PASSWORD")
host = os.getenv("POSTGRES_HOST", "localhost")
port = int(os.getenv("POSTGRES_PORT", "5432"))
photo_table = os.getenv("PHOTO_TABLE", "zdjecia_lotnicze")
metadata_table = os.getenv("METADATA_TABLE", "metadane")
woj_table = os.getenv("WOJEWODZTWA_TABLE", "wojewodztwa")
pow_table = os.getenv("POWIATY_TABLE", "powiaty")
gmi_table = os.getenv("GMINY_TABLE", "gminy")


class DatabaseTables:
    photo_table = photo_table
    metadata_table = metadata_table
    woj_table = woj_table
    pow_table = pow_table
    gmi_table = gmi_table

pool = None


def init_pool(
    max_retries: int = 10,
    retry_delay: int = 2
) -> SimpleConnectionPool:
    global pool
    if pool is None:
        for attempt in range(1, max_retries + 1):
            try:
                pool = SimpleConnectionPool(
                    minconn=3,
                    maxconn=10,
                    dbname=dbname,
                    user=user,
                    password=password,
                    host=host,
                    port=port
                )
                break
            except Exception as e:
                if attempt == max_retries:
                    print(f"Failed to connect to database after {max_retries} attempts: {e}")
                    raise
                time.sleep(retry_delay)
    return pool

def get_connection():
    global pool
    if pool is None:
        init_pool()
    return pool.getconn()

def release_connection(conn):
    global pool
    if pool:
        pool.putconn(conn)

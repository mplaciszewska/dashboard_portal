from psycopg2.pool import SimpleConnectionPool
from .POSTGRES import dbname, user, password, host, port, photo_table, metadata_table, woj_table, pow_table, gmi_table


class DatabaseTables:
    photo_table = photo_table
    metadata_table = metadata_table
    woj_table = woj_table
    pow_table = pow_table
    gmi_table = gmi_table

pool = None

def init_pool():
    global pool
    if pool is None:
        pool = SimpleConnectionPool(
            minconn=1,
            maxconn=10,
            dbname=dbname,
            user=user,
            password=password,
            host=host,
            port=port
        )
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

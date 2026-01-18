## Setup

1. Clone the repository
```
git clone https://github.com/mplaciszewska/dashboard_portal.git
```

2. Prepare database backup
```
docker cp backup.sql postgis:/backup.sql
docker start postgis
docker exec -it postgis psql -U postgres -d praca_inzynierska_db -f /backup.sql
```

3. Build docker images
```
docker compose up --build
```

4. Start all services
```
docker compose up
```

Frontend app available at:  http://localhost:3000
Backend endpoints available at: http://localhost:8000/api


<img width="1917" height="907" alt="image" src="https://github.com/user-attachments/assets/37f25cf0-d081-436d-8ea0-bae44016293c" />
<img width="1022" height="574" alt="image" src="https://github.com/user-attachments/assets/8815871d-83da-4859-a03d-5d97460175f1" />

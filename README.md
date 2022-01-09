# Note App

A two service application using Python(Flask) and Nodejs(Express)

#### Requirements

- Ensure you have [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/) installed and set on your device

## Note Service

#### Requirements

- See `./note/.env` file to see the default environment variables set

## User Service

#### Requirements

- See `./user/.env` file to see the default environment variables set

## Installation and Usage

### Basic

- Run:

```bash
docker-compose up --build -d
```

- Change DATABASE_URL in `./user/.env` to `mysql://nesidex:nesidex@localhost:33060/Note_App` using the default environment variables set

- Run:

```bash
npx prisma migrate deploy
```

- Finally, change DATABASE_URL in `./user/.env` back to `mysql://nesidex:nesidex@db:3306/Note_App` using the default environment variables set

### DB Replication

- Open an interactive shell by running:

```
sudo docker exec -it mongodb0 mongo
```

- Copy and paste the following into the shell and hit Enter:

```
rs.initiate( {
   _id : "rsmongo",
   members: [
      { _id: 0, host: "mongodb0:27017" },
      { _id: 1, host: "mongodb1:27017" },
      { _id: 2, host: "mongodb2:27017" }
   ]
})
```

### Logging (Prometheus + Grafana)

- To access the Microservice and API Gateway default metrics logs:

  - Note service metrics: `http://127.0.0.1:8080/note/metrics`
  - User service metrics: `http://127.0.0.1:8080/user/metrics`
  - API gateway metrics: `http://127.0.0.1:8080/metrics`

- To access the Prometheus page: `http://127.0.0.1:9090`

- To access the Grafana page: `http://127.0.0.1:3000`

### Cache Replication

The cache master and slave have been automatically set in the docker-compose.yml file. See that two Redis containers are running: `redis` and `redis-slave`

## API Endpoints

Running all tests on localhost

### Note

- HEAD: http://127.0.0.1:8080/note
- GET: http://127.0.0.1:8080/note/all/2

  Fetch all user notes using the user id e.g 2

- GET: http://127.0.0.1:8080/note/2/619a00c33b5e2eddae631538

  Fetch details of user note using the user id and the note id e.g 2 as user id and 619a00c33b5e2eddae631538 as note id

- POST: http://127.0.0.1:8080/note

  Create a note for a user by passing the below JSON in the request body

  ```
  {
    "user_id": 2,
    "title": "Note Title",
    "description": "Note description"
  }
  ```

- PUT: http://127.0.0.1:8080/note

  Update a note for a user by passing the below JSON in the request body

  ```
  {
    "id": "619a00c33b5e2eddae631538",
    "user_id": 2,
    "title": "Updated Note Title",
    "description": "Updated Note description"
  }
  ```

- DELETE: http://127.0.0.1:8080/note

  Delete a note for a user by passing the below JSON in the request body

  ```
  {
    "id": "619a00c33b5e2eddae631538",
    "user_id": 2
  }
  ```

### User

- HEAD: http://127.0.0.1:8080/user

- POST: http://127.0.0.1:8080/user/signup

  Create a user by passing the below JSON in the request body

  ```
  {
    "name": "Test",
    "email": "test@test.com",
    "password": "00000000"
  }
  ```

- POST: http://127.0.0.1:8080/user/login

  User Login and Token generation by passing the below JSON in the request body

  ```
  {
    "email": "test@test.com",
    "password": "00000000"
  }
  ```

- POST: http://127.0.0.1:8080/user/verify

  Verify user token

  ```
  {
    "email": "test@test.com",
    "id": "1"
  }
  ```

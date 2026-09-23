# Student Grade Tracker

A beginner-friendly grade management web application built for the CodeAlpha Java Programming internship. Add student records, manage them from a responsive dashboard, and review the class performance summary at a glance.

## Features

- Add a student name and marks from 0 to 100.
- View all student records in a table.
- Edit or delete an existing student record.
- Automatically calculate:
  - Average score
  - Highest score
  - Lowest score
  - Passing students
  - Pass rate
- Automatically assign a grade from A to F.
- Show clear validation and empty states.
- Responsive layout for desktop, tablet, and mobile screens.
- Store records in Java data structures (`ConcurrentHashMap` and `AtomicLong`).
- No database, paid service, or external API is required.

## Technologies

### Backend

- Java 17+
- Spring Boot 3
- Spring Web
- Spring Validation
- Maven

### Frontend

- React + Vite
- HTML and CSS
- TypeScript/JavaScript
- TanStack React Query for API state

The generated API contract lives in `lib/api-spec/openapi.yaml`. The frontend uses the generated client from `lib/api-client-react`.

## Project structure

```text
backend/
  src/main/java/com/codealpha/gradetracker/
    controller/     REST endpoints and validation error handling
    model/          Student, input, summary, and error models
    service/        In-memory student record and summary logic
  pom.xml

artifacts/student-grade-tracker/
  src/              React frontend
  package.json

lib/api-spec/openapi.yaml
```

## Run the Spring Boot backend

Requirements: Java 17 or newer and Maven 3.9 or newer.

```bash
cd backend
mvn spring-boot:run
```

The API starts at `http://localhost:8080`.

## Run the frontend

From the project root:

```bash
pnpm install
pnpm --filter @workspace/student-grade-tracker run dev
```

The frontend runs through the Replit preview workflow. For local development outside Replit, configure your frontend dev server to proxy `/api` to `http://localhost:8080`, or run the frontend and backend behind the same origin.

## API endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/students` | List all students |
| `POST` | `/api/students` | Add a student |
| `PUT` | `/api/students/{id}` | Update a student |
| `DELETE` | `/api/students/{id}` | Delete a student |
| `GET` | `/api/students/summary` | Get calculated summary metrics |

Example request:

```json
{
  "name": "Priya Patel",
  "marks": 86
}
```

Marks outside the inclusive range `0` to `100`, blank names, and malformed requests return a `400` response with a readable error message.

## Notes about storage

This internship version intentionally uses in-memory Java collections instead of a database. It is easy to understand and demonstrates the core Java data-structure requirement. Records reset when the Spring Boot application restarts. A database can be added later by replacing the service implementation without changing the API contract.

## Build for deployment

Build the backend:

```bash
cd backend
mvn clean package
java -jar target/student-grade-tracker-1.0.0.jar
```

Build the frontend:

```bash
pnpm --filter @workspace/student-grade-tracker run build
```

The frontend build also copies the generated files into the Spring Boot static resources and packages the backend JAR. To run the resulting single-origin build:

```bash
java -jar backend/target/student-grade-tracker-1.0.0.jar
```

The Spring Boot process serves the dashboard and the `/api` endpoints together. For Replit development preview, the managed workflow starts Spring Boot on port `8080` and Vite on the preview port with `/api` proxied to Spring Boot.
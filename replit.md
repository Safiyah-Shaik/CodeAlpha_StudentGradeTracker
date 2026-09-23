# Student Grade Tracker

Student Grade Tracker is a responsive grade dashboard for adding, editing, removing, and summarizing student marks.

## Run & Operate

- `pnpm --filter @workspace/student-grade-tracker run dev` — run the Vite frontend (the managed workflow starts Spring Boot on port 8080 alongside it)
- `cd backend && mvn spring-boot:run` — run the Java backend directly
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- Frontend preview requires `PORT` and `BASE_PATH`; the managed artifact workflow provides them

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Java 17+ with Spring Boot 3, Spring Web, and Spring Validation
- Storage: Java `ConcurrentHashMap` and `AtomicLong` in `backend/src/main/java/com/codealpha/gradetracker/service/StudentService.java`
- Frontend: React + Vite, HTML/CSS, TanStack React Query
- API codegen: Orval from `lib/api-spec/openapi.yaml`
- Build: Maven for Java, Vite for frontend

## Where things live

- `backend/` — Spring Boot application and in-memory student service
- `artifacts/student-grade-tracker/` — React/Vite dashboard artifact
- `lib/api-spec/openapi.yaml` — source-of-truth API contract
- `README.md` — setup, features, API reference, and deployment notes

## Architecture decisions

- Student records intentionally use in-memory Java collections for the internship requirement; data resets on backend restart.
- The frontend talks to `/api` through the generated client and the Vite dev proxy.
- The dashboard seeds three sample records in the Java service so the summary and table are useful on first launch.

## Product

Users can add student names and scores, edit or remove records, search and sort the class list, and see average, highest, lowest, passing, and pass-rate metrics.

## User preferences

- Keep the Java backend beginner-friendly and avoid adding a database unless requested.

## Gotchas

- If the frontend is run outside the managed workflow, start Spring Boot on port 8080 and proxy `/api` to it.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details

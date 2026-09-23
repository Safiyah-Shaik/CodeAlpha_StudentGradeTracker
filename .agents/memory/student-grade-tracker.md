---
name: Student Grade Tracker runtime
description: Combined Vite and Spring Boot preview setup for this project.
---

The managed web workflow runs from the frontend artifact directory and injects the frontend `PORT` into its process environment. When launching the Spring Boot backend from that workflow, reference the backend with a path relative to the artifact directory and override `PORT` for Spring Boot so it does not collide with Vite.

**Why:** Starting Spring Boot with the workflow's inherited port caused a collision and starting it from the workspace root used the wrong relative path.

**How to apply:** Keep the Vite proxy pointed at the dedicated Spring Boot port and preserve the combined workflow command when changing preview setup.
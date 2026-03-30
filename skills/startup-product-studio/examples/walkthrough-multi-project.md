# Walkthrough: Multi-Project Studio

This walkthrough demonstrates managing multiple related products within a single studio workspace. The example builds **HealthTech Studio** — a suite of three products for a digital health platform: a patient portal, a provider dashboard, and shared packages.

## 1. Studio and First Product

```json
{ "action": "init-studio", "studioName": "HealthTech Studio" }
```

```json
{
  "action": "create-project",
  "projectName": "MedConnect Patient Portal",
  "projectDescription": "Patient-facing portal for appointment scheduling, medical records access, prescription management, and secure messaging with healthcare providers. HIPAA-compliant, mobile-first design.",
  "codeProjects": [
    { "name": "medconnect-web", "type": "web", "techStack": "Next.js, TypeScript, Tailwind CSS" },
    { "name": "medconnect-mobile", "type": "mobile", "techStack": "React Native, TypeScript, Expo" },
    { "name": "medconnect-api", "type": "backend", "techStack": "Node.js, Fastify, PostgreSQL, Prisma" },
    { "name": "medconnect-infra", "type": "infra", "techStack": "Terraform, AWS, Docker" }
  ]
}
```

The Patient Portal starts with four code projects spanning web, mobile, backend, and infrastructure. Constraints include HIPAA compliance and EHR integration via HL7 FHIR.

## 2. Progress the Patient Portal

The Patient Portal advances through discovery, roadmap-definition, product-definition, and ux-definition. At ux-definition, the user requests a revision:

```json
{
  "decision": "revise",
  "feedback": "Need more focus on mobile-first flows"
}
```

The skill re-runs relevant UX steps incorporating the feedback. After the revision is approved, the project continues through architecture-definition with a note to evaluate FHIR R4 vs R5.

By this point, the Patient Portal is in the implementation phase with 12 of 28 tasks completed and one blocker ("EHR sandbox access pending").

## 3. Add the Provider Dashboard

While the Patient Portal is in implementation, the user creates a second product:

```json
{
  "action": "create-project",
  "projectName": "MedConnect Provider Dashboard",
  "projectDescription": "Provider-facing dashboard for patient management, scheduling, clinical notes, and analytics. Integrates with the Patient Portal API and EHR systems.",
  "codeProjects": [
    { "name": "provider-dashboard", "type": "web", "techStack": "Next.js, TypeScript, Tailwind CSS, Recharts" },
    { "name": "provider-workers", "type": "worker", "techStack": "Node.js, BullMQ, Redis" }
  ]
}
```

The Provider Dashboard starts in the discovery phase independently. Its constraints reference the shared API with the Patient Portal.

## 4. Switch Between Projects

```json
{ "action": "switch-project", "projectName": "MedConnect Provider Dashboard" }
```

The active project context changes. Running phases now operates on the Provider Dashboard. The Patient Portal's state is preserved and continues tracking its implementation progress.

```json
{ "action": "run-phase" }
```

This runs the discovery phase for the Provider Dashboard while the Patient Portal remains in implementation.

## 5. Add Shared Packages

A third product captures the shared code:

```json
{
  "action": "create-project",
  "projectName": "MedConnect Shared Packages",
  "projectDescription": "Shared TypeScript packages for types, validation schemas, API client, and design tokens used across Patient Portal and Provider Dashboard.",
  "codeProjects": [
    { "name": "medconnect-types", "type": "shared", "techStack": "TypeScript, Zod" },
    { "name": "medconnect-ui", "type": "shared", "techStack": "React, TypeScript, Storybook" },
    { "name": "medconnect-docs", "type": "docs", "techStack": "Nextra, MDX" }
  ]
}
```

Shared Packages is a lighter product — its discovery phase focuses on defining what should be extracted into shared libraries and what the consumption model looks like across web and mobile projects.

## 6. Cross-Project Status Report

```json
{ "action": "status-report" }
```

The Product Manager role generates a unified report across all three products:

| Project | Phase | Progress | Blockers |
|---------|-------|----------|----------|
| MedConnect Patient Portal | implementation-phase | 12/28 tasks (43%) | EHR sandbox access pending |
| MedConnect Provider Dashboard | architecture-definition | On track | Must share API with Patient Portal |
| MedConnect Shared Packages | roadmap-definition | On track | Must be consumable by web and mobile |

**At this point, the workspace state matches `multi-project-workspace.json`** — the example JSON file shows the exact shape with three projects at different phases.

## 7. Redirection: Reduce Scope

The user decides the Patient Portal's initial release should skip the mobile app:

```json
{
  "action": "redirect",
  "redirectionAction": "reduce-scope"
}
```

The skill creates a new `RoadmapVersion` (v2) with the mobile-related deliverables removed from remaining phases. The previous roadmap version is preserved for reference.

## 8. Redirection: Change Priorities

Within the Patient Portal's implementation phase, the user reorders sub-phases to prioritize the messaging feature over prescription management:

```json
{
  "action": "redirect",
  "redirectionAction": "change-priorities"
}
```

The `ImplementationPhaseRecord` entries are reordered. Already-completed sub-phases are unaffected.

## Multi-Project Patterns

### Independent Phase Progression

Each project advances through phases independently. There is no global phase — one product can be in release-readiness while another is still in discovery. This lets the team ship incrementally.

### Shared Constraints

Products within the same studio can reference shared constraints. In this example:
- The Provider Dashboard's technical constraints include "Must share API with Patient Portal"
- The Shared Packages' constraints include "Must be consumable by both web and mobile projects"

These are captured in each project's `constraints` field and inform LLM-generated artifacts.

### Cross-Project Artifacts

The `status-report` action generates a unified view. Individual project artifacts remain scoped to their project, but the status report artifact provides cross-cutting visibility.

### Project Types in Practice

| Code Project | Type | Purpose |
|-------------|------|---------|
| medconnect-web | `web` | Patient-facing Next.js web app |
| medconnect-mobile | `mobile` | Patient-facing React Native app |
| medconnect-api | `backend` | Shared API server (Fastify + Prisma) |
| medconnect-infra | `infra` | Terraform infrastructure-as-code |
| provider-dashboard | `web` | Provider-facing Next.js dashboard |
| provider-workers | `worker` | Background job processor (BullMQ) |
| medconnect-types | `shared` | TypeScript types and Zod schemas |
| medconnect-ui | `shared` | Shared React component library |
| medconnect-docs | `docs` | Documentation portal (Nextra) |

# HR Blizz ESS — Leaves Module Test Automation

UI and API test automation for the **Leaves** module of the HR Blizz Employee Self Service (ESS) application. Built with **Playwright + TypeScript** using Page Object Model.

The implemented tests deliberately cover a small set of critical scenarios, but the project is structured as if the suite were large (page objects, fixtures, shared support layer, environment config, tagged projects).

## Requirements

- Node.js `>=22.13.0 <25` (see `.nvmrc`)
- npm or yarn

## Quick start

```bash
npm run setup   # installs deps + Playwright browsers, and creates .env if missing
```

Then fill in the real credentials in `.env` (see below) and run `npm test`.

## Setup

`npm run setup` (via [`scripts/setup.sh`](scripts/setup.sh)) does everything below in one
step — checks your Node version, installs dependencies, installs the Playwright browsers,
and creates `.env` from `.env.example` if it doesn't exist. To do it manually instead:

```bash
npm install
npx playwright install chromium
cp .env.example .env   # then fill in the values (shared separately, see below)
```

### Environment / credentials

Secrets are **never committed**. `.env` is git-ignored. Copy `.env.example`
to `.env` and populate:

| Variable | Meaning |
|---|---|
| `ENVIRONMENT` | Target environment (e.g. `DEV`) |
| `BASE_URL` | App base URL (Playwright `baseURL`, also the sign-in page) |
| `LOGIN_API_URL` | Auth service the login form posts to |
| `USER_API_URL` | Gateway that leave-request (submission) calls go to |
| `API_AUTH_HEADER` | Basic `authorization` header for `sso-api` (login endpoints) |
| `API_AUTH_HEADER_ESS_API` | Basic `authorization` header for `ess-api` (employee endpoints) |
| `API_AUTH_HEADER_USER_API` | Basic `authorization` header for `user-access-gateway` (leave request/submissions) |
| `EMPLOYEE_USERNAME` / `EMPLOYEE_PASSWORD` | Employee account |
| `MANAGER_USERNAME` / `MANAGER_PASSWORD` | Manager account |

## Running

```bash
npm test                # runs everything
npm run test:sanity     # runs critical happy paths (fast)
npm run test:regression # runs deeper leave workflows
npm run test:api        # runs login endpoint api tests
npm run report          # opens the last HTML report
```

## Layout

```
pages/                     Page objects (POM)
  base.ts                  Abstract BasePage (LOCATORS + shared reload())
  login.page.ts            Login (employee / manager)
  home.page.ts             Post-login shell + role-based nav
  leaves/                  Leaves feature pages (my-leaves, request modal, approvals)
support/                   Cross-cutting helpers
  enums.ts                 LeaveType / LeaveStatus / NavItem / PlaceholderText
  date-utils.ts            Leave date helpers (weekday & calendar-day helpers)
  constants/               UI text + route fragments
  api-routes.ts            API route registry
  api-utils.ts             API request context helpers
  environments/            env.config (dotenv-driven, two roles) + types
tests/
  ui/base.ts               Custom fixtures (employeeSession / managerSession; read creds from env)
  ui/sanity/               TS-01, TS-02, TS-03
  ui/regression/leaves/    TS-04/06 approval, TS-07 balance, TS-09
  api/login.spec.ts        Part 3 login endpoint (positive + negative)
```

## Traceability

Test titles carry the `TS-xx` scenario IDs from the Part 1 test-scenario workbook, so
each automated test maps back to a documented scenario.

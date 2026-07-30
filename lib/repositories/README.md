# Database repository conventions

Orbit uses the dependency direction `route handler or server action -> service -> repository -> Prisma`.

Repositories must:

- accept a `RepositoryClient` in their constructor;
- contain persistence queries only;
- require an explicit `projectId` scope for project-owned records;
- filter `archivedAt: null` unless the caller explicitly requests history;
- use unique keys and database constraints instead of read-then-insert duplicate checks;
- return typed domain records or projections rather than HTTP responses;
- allow Prisma errors to be translated by the service layer;
- never call `$transaction`, `$connect`, `$disconnect`, or hide transaction boundaries.

Services own transactions through `withTransaction`. A service passes the transaction client to every repository participating in the operation, so all writes succeed or roll back together.

Hard deletion is reserved for explicit administrative cleanup. Normal business deletion sets `archivedAt`, preserving historical and audit relationships.

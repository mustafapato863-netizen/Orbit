# Orbit project dashboard

Orbit is a dependency-free project dashboard with JSON persistence.

## Run locally

1. Make sure Node.js 18 or newer is installed.
2. Run `npm start` in this directory.
3. Open `http://localhost:3000`.

Projects are stored in `projects.json`. Milestones and nested sub-milestones are stored in `db.json`. Milestone progress is calculated from completed sub-milestones; milestones without sub-milestones use 100% for `Completed` and 0% for every other status. Project progress is the average of its milestone progress values.

Opening `index.html` directly will show a connection message because browsers cannot safely write local JSON files without the local server.

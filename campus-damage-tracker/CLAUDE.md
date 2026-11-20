# CLAUDE.md

@AGENTS.md

## Claude Code notes

- `AGENTS.md` above is the source of truth for rules, commands and workflow. The `docs/` folder holds the detailed specs it points to.
- Work from `docs/TASKS.md`, one task at a time. Use a plan before editing when a task touches more than three files.
- Run `npm run lint && npm run typecheck && npm run test` before saying a task is done.
- Prefer reading the relevant `docs/` file over guessing. If the docs are silent, ask rather than invent behaviour.
- Keep summaries short: what changed, what was tested, what is open.

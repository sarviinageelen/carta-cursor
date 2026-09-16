# Technical references for the build brief

Reviewed 16 September 2026. These references support engineering choices and agent workflow; they are not evidence about Carta's private implementation. Resolve exact compatible library versions in the target repository before installation.

| Official reference | How it informed the brief |
| --- | --- |
| [Cursor project rules](https://cursor.com/docs/rules) | A compact `.mdc` rule in `.cursor/rules` preserves project constraints. `alwaysApply: true` is used; the large brief stays in an ordinary referenced Markdown file. |
| [Cursor Agent overview](https://cursor.com/docs/agent/overview) | The task is framed as repository implementation and verification, not a chat-only architecture answer. |
| [Anthropic prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices) | Explicit outcomes, incremental work, saved progress, bounded delegation, and evidence-based handoff support a long-running coding task. The prompt avoids unnecessary abstractions and fabricated tool use. |
| [Anthropic Opus 5 announcement](https://www.anthropic.com/news/claude-opus-5) | Confirms the user's named model family. Cursor's exact available settings remain an application/account matter; no model API integration is needed just to use a coding agent. |
| [Next.js Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components) | Server-rendered data access and layouts, with focused interactive client boundaries and server-only modules. |
| [Next.js authentication guide](https://nextjs.org/docs/app/guides/authentication) | Centralized authorization/data-access logic and checks on server actions/route handlers, rather than relying on hidden UI controls. |
| [Next.js mutating data](https://nextjs.org/docs/app/getting-started/mutating-data) | Server mutations and post-mutation view updates; directly callable actions still need validation and access checks. |
| [Drizzle SQLite guide](https://orm.drizzle.team/docs/sqlite/get-started-sqlite) | Local SQLite is a supported persistence option. Check driver/ORM compatibility and use stable releases; do not blindly copy prerelease package tags from examples. |

The proposed component libraries, SQLite choice, design tokens, demo permissions, test requirements and calculation profiles are design recommendations, not claims that Carta uses those technologies or conventions.

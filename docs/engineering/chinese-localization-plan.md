# Chinese UI Localization Plan

**Goal:** Make the self-hosted platform's application-owned interface consistently Simplified Chinese by default, without translating user data or changing application behavior.

**Architecture:** Keep the existing `LanguageProvider` and explicit English/Chinese `t` pairs. Translate at the presentation boundary, including dynamic templates, loading/error states, tool summaries, dialogs and accessible labels. Preserve identifiers and raw content.

## Constraints
- Do not build, start, stop, restart or deploy applications.
- Do not commit, switch branches, overwrite existing edits or edit stored conversations.
- Do not translate brands, provider/model names, commands, URLs, API fields, file contents or user-authored values.
- Keep English compatibility in isolated components and tests; the application root remains Chinese by default.
- Use the existing E-drive Node dependency snapshot for checks; do not install tooling on C.

## Tasks
- [x] Audit application-owned JSX text, attributes, templates, helper labels and notifications.
- [x] Localize chat, tools, approvals and chat-side panels, with provider-based regression tests.
- [x] Localize workflow builder and library, retaining all graph and execution identifiers.
- [x] Localize account, profile and settings forms, validation, dialogs and notices.
- [x] Localize home, team, marketplace and shared platform flows.
- [x] Localize reusable output/input renderers, navigation and accessible controls.
- [x] Localize administrative views and application-owned public/authentication copy.
- [x] Add repeatable localization coverage checks with explicit technical exclusions.
- [x] Run scoped formatting/lint, full type checks and related unit tests without running the app.
- [x] Report exact verification results and any remaining external-data or environment limitations.

## Verification
Tests render actual components with `LanguageProvider` in Chinese and verify that raw user/tool values and destinations stay unchanged. Pure helpers retain an English default and receive an explicit locale from their UI callers. Static checks inspect only application-owned display text, not arbitrary string literals. Validate in an isolated source snapshot so global formatting does not rewrite unrelated files; hash-compare changed files against the tested snapshot.

## Repeatable Audit

Run `pnpm audit:localization` from `autogpt_platform/frontend`. The TypeScript AST scan covers JSX text, visible string attributes, fallback/template expressions and notification titles/descriptions in `.ts` and `.tsx` files. It reports mixed text such as `Chat with 凯西` as well as untranslated English. Script kinds are selected by extension so TypeScript generics are not mistaken for JSX.

`scripts/localization/technical-copy.json` contains exact path/text exclusions for administrative protocol labels. Brands, identifiers, URLs and code samples are excluded by the scanner. Do not expand these exclusions to conceal untranslated product copy.

A zero-finding audit is not proof that every runtime value is Chinese: helper-generated text needs tests and call-site review, and raw server/provider messages, user-created names, imported content and existing stored conversation titles are intentionally unchanged. Do not translate arbitrary user data or modify database records to make the audit appear complete.

Language changes must not repeat payment fulfillment, credential loading or onboarding writes. Regression tests exercise request counts and in-flight failures using the latest language, with stable notification callbacks rather than adding translation functions to request-triggering effect dependencies.

## Validation Record

### Final Frozen-Source Checks

- Ran `pnpm format` → `pnpm lint` → `pnpm types` → scoped `pnpm test:unit` with V8 coverage, in that order. Formatting, ESLint, design-system lint, Prettier and full frontend type checking all exit successfully; existing warnings remain.
- The final scoped run passes: **179 files / 1,952 tests**. The bracketed link-token route is checked separately with the link directory: **three files / 23 tests pass**. These are scoped results, not a fresh passing full-suite run.
- `pnpm audit:localization` reports **zero findings** with the exact technical exclusions. A separate scan of the actual source tree, rather than only the validation copy, also reports zero findings.
- SHA-256 checks confirm all **1,057 changed/additional frontend files** in the final validation snapshot match the working source, with no mismatches or concurrent changes. Format copy-back was restricted to this checked list; unrelated source was not replaced.
- The final checks include real-component tests for explicit Chinese date formatting on an English-default system, trial and usage labels, schema type hints, raw content preservation and request-count stability. No compiler/design-system bailout baseline or suppression was added.

### Full-Suite Limitations and Additional Diagnosis

- An earlier full `pnpm test:unit --maxWorkers=1 --reporter=dot` run with V8 coverage completed with 1,300 files passing and 73 failing; 14,893 tests passed, 184 failed and one was an expected failure. Localization regressions found there were addressed and rechecked, but the full suite was not rerun after the final fixes. Do not report that earlier full run as passing.
- Restoring the sibling backend fixture directory allows 21 suites / 408 tests to pass (plus four expected failures). Three auth-schema tests still fail on Windows: their LF-only replacement expressions do not alter the CRLF Prisma fixture. A direct probe confirms this. The schema and these tests were not changed.
- Independent probes confirm that the Windows default Intl locale is `zh-CN` (`US$20` versus `$20` with explicit `en-US`). Under an explicitly English default in the ignored validation environment, 16 of 17 follow-up suites pass (179 tests); one test still times out in shared request-cleanup teardown. Product English fallback behavior is not forced to `en-US` to accommodate those tests.
- The existing React Compiler source filter does not match Windows backslash paths. Normalizing separators only in the ignored validation copy lets all four compiler suites / 28 tests pass. This also exposed a real localization-induced compiler bailout in the stop hook: adding its first hook made an existing conditional inside `try` eligible for compilation. Extracting the unchanged cancellation predicate fixes that unsupported shape without an exemption. Product compiler configuration and baselines remain unchanged.
- Other failures from the original full run, including unrelated auth timing, MCP mocks and marketplace category behavior, were not hidden by changing product behavior or loosening test requirements.
- No build, application start, database rewrite or visual browser verification is part of this work. Existing stored English titles, raw provider diagnostics and third-party/user-authored content are intentionally preserved. A zero-finding static scan is not proof that every possible runtime value is Chinese.

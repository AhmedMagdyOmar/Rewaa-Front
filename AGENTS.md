<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

Do NOT run builds after every single change, only after big changes. For small changes, just run type-check and lint and any tests that are available.

## Package Manager

- This frontend repository strictly uses `pnpm` (not `npm` or `yarn`). Run scripts and tests via `pnpm` (e.g., `pnpm exec tsc --noEmit`, `pnpm test`).

<!-- END:nextjs-agent-rules -->

## Arabic Pluralization Guidelines (جمع القلة وجمع الكثرة والتمييز)

In Arabic localization, object count pluralization follows specific grammatical rules for count forms (`zero`, `one`, `two`, `few`, `many`, `other`):

1. **Dual (`two`) / 2**:
   - Use the dual form without explicit digits (e.g. `طالبين` or `دروس` / `درسين`).
2. **Few (`few`) / 3 to 10**:
   - Plural form + number placeholder `{count}` (e.g. `{count} طلاب`, `{count} دروس`).
   - Grammatical rule: Numbers from 3 to 10 take a plural noun in genitive case (جمع مجرور).
3. **Many (`many`) / 11 to 99**:
   - Accusative singular noun + number placeholder `{count}` (e.g. `{count} طالباً`, `{count} درساً`).
   - Grammatical rule: Numbers from 11 to 99 take a singular accusative noun (مفرد منصوب على التمييز).
4. **Other (`other`) / 100, 1000, etc.**:
   - Genitive singular noun + number placeholder `{count}` (e.g. `{count} طالب`, `{count} درس`).
   - Grammatical rule: Hundreds and thousands take a singular genitive noun (مفرد مجرور).
5. **Zero / One (`zero`, `one`)**:
   - `zero`: Negative noun phrase `لا ...` (e.g. `لا طلاب`, `لا دروس`, `لا فصول`, `لا دورات`).
   - `one`: Singular noun with explicit gendered adjective `واحد` / `واحدة` (e.g. `طالب واحد`, `درس واحد`, `دورة واحدة`).

### Standard ICU Format Example in JSON messages:

```json
{
  "students": "{count, plural, =0 {لا طلاب} zero {لا طلاب} one {طالب واحد} two {طالبين} few {{count} طلاب} many {{count} طالباً} other {{count} طالب}}",
  "lessons": "{count, plural, =0 {لا دروس} zero {لا دروس} one {درس واحد} two {درسين} few {{count} دروس} many {{count} درساً} other {{count} درس}}",
  "courses": "{total, plural, =0 {لا دورات} zero {لا دورات} one {دورة واحدة} two {دورتين} few {{total} دورات} many {{total} دورة} other {{total} دورة}}"
}
```

### React / next-intl Component Usage:

Always pass `{ count }` to `t()` instead of string concatenation:

```tsx
// ❌ Incorrect concatenation
<span>{course.numberOfLessons} {t("card.lessonsShort")}</span>

// ✅ Correct ICU plural rendering
<span>{t("card.lessonsShort", { count: course.numberOfLessons })}</span>
```

## Standard Back Button Navigation UI Pattern

All sub-pages across the app (details, creation, and edit pages) MUST use a single standardized round icon button for navigating back to a parent page:

```tsx
<Button asChild variant="outline" size="icon" className="h-9 w-9 rounded-full shrink-0">
  <Link href={parentPath}>
    <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
  </Link>
</Button>
```

- Always place this button adjacent to the page's main `<h1>` title inside a flex container (`flex items-center gap-3`).
- Always use `rtl:rotate-180` on `<ArrowLeft />` so RTL mode automatically flips the arrow direction without needing conditional logic.

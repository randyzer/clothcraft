# AGENTS.md

 
This file is a bilingual copy of `AGENTS.md` for easier reading and maintenance.
本文件是 `AGENTS.md` 的中英文对照副本，便于阅读与维护。 

This file gives coding agents an accurate working map for this repository.  
这个文件为编码代理提供了这个仓库的准确工作地图。

## What This Repo Is

## 这个仓库是什么

`sistine-starter-vibe-to-production` is a production-oriented AI SaaS starter for teaching AI coding and launching commercial AI products quickly.  
`sistine-starter-vibe-to-production` 是一个面向生产环境的 AI SaaS 启动模板，用来教授 AI 编码，并帮助快速上线商业化 AI 产品。

The repo already includes:  
这个仓库已经包含：

- Better Auth email/password auth plus Google OAuth UI
- Better Auth 邮箱密码认证，以及 Google OAuth UI

- Credit-based billing with Creem subscriptions and one-time packs
- 基于积分的计费系统，包含 Creem 订阅和一次性积分包

- Volcano Engine integrations for chat, image generation, and video generation
- 火山引擎集成，支持对话、图像生成和视频生成

- Admin screens for users, subscriptions, and credit operations
- 用户、订阅和积分操作的管理后台页面

- Marketing pages, blog, docs-style messaging, and legal pages
- 营销页面、博客、文档风格页面以及法律页面

- `next-intl` localization for English and Chinese
- 基于 `next-intl` 的中英文国际化

Optimize changes for two goals at the same time:  
进行修改时，需要同时兼顾两个目标：

1. Keep the starter reusable for buyers and students.
1. 让这个 starter 对购买者和学习者都保持可复用性。

2. Keep production data flows correct for auth, billing, credits, and generation history.
2. 保证认证、计费、积分和生成历史这些生产数据流的正确性。

## Ground Rules

## 基本规则

- Use `pnpm` for installs and scripts. `package-lock.json` exists, but `package.json` declares `pnpm` as the package manager.
- 安装依赖和运行脚本时使用 `pnpm`。虽然仓库里有 `package-lock.json`，但 `package.json` 明确声明了包管理器是 `pnpm`。

- Prefer accurate docs over aspirational docs. If the code and docs disagree, fix the docs or fix the code.
- 优先保证文档准确，而不是写“理想中的文档”。如果代码和文档不一致，要么修文档，要么修代码。

- Do not reintroduce remote demo asset dependencies that the app can serve locally.
- 不要重新引入那些本项目已经可以本地提供的远程 demo 资源依赖。

- Treat billing, credits, subscriptions, and auth as consistency-sensitive systems. Avoid "UI-only" updates that leave DB state drifting.
- 把计费、积分、订阅和认证都当成对一致性高度敏感的系统。避免只改 UI、不改后端状态，导致数据库状态漂移。

## Stack Snapshot

## 技术栈概览

- Framework: Next.js 16.2.2 App Router
- 框架：Next.js 16.2.2 App Router

- React: 19
- React：19

- Language: TypeScript with strict mode
- 语言：开启 strict mode 的 TypeScript

- Styling: Tailwind CSS + Framer Motion
- 样式：Tailwind CSS + Framer Motion

- Auth: Better Auth + Drizzle adapter
- 认证：Better Auth + Drizzle 适配器

- Database: PostgreSQL + Drizzle ORM
- 数据库：PostgreSQL + Drizzle ORM

- Payments: Creem
- 支付：Creem

- AI provider: Volcano Engine / Doubao
- AI 提供方：火山引擎 / 豆包

- Email: Resend
- 邮件：Resend

- Optional storage: S3-compatible / Cloudflare R2 style config
- 可选存储：兼容 S3 的对象存储 / Cloudflare R2 风格配置

- Testing: Vitest + Testing Library
- 测试：Vitest + Testing Library

## High-Level Repo Map

## 仓库高层结构图


### App routes

### 应用路由

- `app/[locale]/(marketing)`:
  landing page, pricing, contact, blog, legal pages
- `app/[locale]/(marketing)`：
  首页、定价页、联系页、博客和法律页面

- `app/[locale]/(auth)`:
  login, signup, forgot password, reset password
- `app/[locale]/(auth)`：
  登录、注册、忘记密码、重置密码

- `app/[locale]/(protected)`:
  dashboard, profile, settings, credits
- `app/[locale]/(protected)`：
  仪表盘、个人资料、设置、积分页

- `app/[locale]/(admin)`:
  admin pages for user and billing operations
- `app/[locale]/(admin)`：
  用户和计费操作的后台管理页面

- `app/[locale]/demo`:
  demo entry plus dedicated chat/image/video demo pages
- `app/[locale]/demo`：
  demo 总入口，以及独立的聊天/图片/视频 demo 页面

- `app/api`:
  auth, chat, image, video, admin, payments, uploads, newsletter, cron
- `app/api`：
  认证、聊天、图片、视频、后台、支付、上传、邮件订阅、定时任务

### Core library modules

### 核心库模块

- `lib/auth.ts`: Better Auth config and signup credit bonus hook
- `lib/auth.ts`：Better Auth 配置，以及注册赠送积分的 hook

- `lib/auth/session.ts`: session/user resolution from headers
- `lib/auth/session.ts`：从请求头解析 session / user

- `lib/auth/admin.ts`: admin authorization helpers
- `lib/auth/admin.ts`：管理员鉴权辅助函数

- `lib/db/schema.ts`: source of truth for tables
- `lib/db/schema.ts`：数据库表结构的真实来源

- `lib/credits.ts`: credit reads, deductions, refunds
- `lib/credits.ts`：积分查询、扣减和退款

- `lib/credit-compensation.ts`: refund-on-failure helper for paid AI actions
- `lib/credit-compensation.ts`：付费 AI 操作失败时的退款补偿辅助逻辑

- `lib/payments/creem.ts`: checkout and webhook helpers
- `lib/payments/creem.ts`：checkout 和 webhook 的辅助逻辑

- `lib/billing/subscription.ts`: annual installment schedule logic
- `lib/billing/subscription.ts`：年付订阅分期发放积分的调度逻辑

- `lib/r2-storage.ts`: storage mirroring and fallback behavior
- `lib/r2-storage.ts`：对象存储镜像与回退逻辑

- `lib/volcano-engine/*`: chat, image, and video provider wrappers
- `lib/volcano-engine/*`：对话、图片和视频能力的提供方封装

- `lib/email.ts`: resilient email sending and email templates
- `lib/email.ts`：更健壮的邮件发送逻辑和邮件模板

### Config and content

### 配置和内容

- `constants/billing.ts`: all plan keys, pack keys, prices, and Creem product IDs
- `constants/billing.ts`：所有订阅 plan key、积分包 key、价格和 Creem 产品 ID

- `constants/website.ts`: shared app/docs name and public URL config
- `constants/website.ts`：应用名、文档名和公开 URL 的共享配置

- `messages/en.json`, `messages/zh.json`: user-facing translations
- `messages/en.json`、`messages/zh.json`：面向用户的界面翻译文案

- `messages/seo.en.json`, `messages/seo.zh.json`: SEO translations
- `messages/seo.en.json`、`messages/seo.zh.json`：SEO 文案翻译

- `app/[locale]/(marketing)/blog/*/*.mdx`: blog content
- `app/[locale]/(marketing)/blog/*/*.mdx`：博客内容

- `content/docs/**/*.mdx`: source content for the built-in Fumadocs docs site
- `content/docs/**/*.mdx`：内置 Fumadocs 文档站的源内容

- `lib/blog-manifest.generated.ts`: generated file, do not edit by hand
- `lib/blog-manifest.generated.ts`：生成文件，不要手工修改

- `public/fumadocs-style.css`: generated stylesheet synced from `fumadocs-ui`
- `public/fumadocs-style.css`：从 `fumadocs-ui` 同步来的生成样式文件

- `public/starter`: local demo assets used by marketing and demo pages
- `public/starter`：营销页和 demo 页使用的本地 demo 资源

- `.asset-sources/starter-demo`: source stills used to generate local demo videos
- `.asset-sources/starter-demo`：用于生成本地 demo 视频的源图片素材

## Daily Commands

## 日常命令

```bash
pnpm dev
pnpm dev:webpack
pnpm lint
pnpm test
pnpm build
pnpm db:generate
pnpm db:migrate
pnpm db:push
pnpm db:studio
pnpm admin:setup
pnpm generate:blog-manifest
```

Notes:  
说明：

- `pnpm dev` runs `scripts/run-dev.mjs`, which launches Next dev with a cleaned environment and syncs the Fumadocs stylesheet first. It does not regenerate the blog manifest.
- `pnpm dev` 会运行 `scripts/run-dev.mjs`，它会在一个清理后的环境中启动 Next 开发服务器，并先同步 Fumadocs 样式文件。它不会重新生成 blog manifest。

- `pnpm dev:webpack` is the safe fallback if Turbopack is too heavy on the current machine.
- 如果当前机器上 Turbopack 太重，`pnpm dev:webpack` 是更稳妥的回退方案。

- `pnpm build` runs both `sync:fumadocs-style` and `generate:blog-manifest` before building.
- `pnpm build` 在正式构建前会先执行 `sync:fumadocs-style` 和 `generate:blog-manifest`。

- If you add, rename, or remove blog posts, regenerate the blog manifest before committing.
- 如果你新增、重命名或删除博客文章，提交前要重新生成 blog manifest。

## Environment Variables

## 环境变量

Use `.env.example` as the source of truth for required names.  
把 `.env.example` 作为所需环境变量名称的唯一真实来源。

The important groups are:  
重要的环境变量分组如下：

- Database: `DATABASE_URL`
- 数据库：`DATABASE_URL`

- Auth: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`
- 认证：`BETTER_AUTH_SECRET`、`BETTER_AUTH_URL`

- Optional Google auth: `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`
- 可选的 Google 登录：`AUTH_GOOGLE_ID`、`AUTH_GOOGLE_SECRET`

- AI: `VOLCANO_ENGINE_API_KEY`, `VOLCANO_ENGINE_API_URL`
- AI：`VOLCANO_ENGINE_API_KEY`、`VOLCANO_ENGINE_API_URL`

- Payments: `CREEM_API_KEY`, `CREEM_WEBHOOK_SECRET`
- 支付：`CREEM_API_KEY`、`CREEM_WEBHOOK_SECRET`

- Email: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
- 邮件：`RESEND_API_KEY`、`RESEND_FROM_EMAIL`

- App URL: `NEXT_PUBLIC_APP_URL`
- 应用 URL：`NEXT_PUBLIC_APP_URL`

- Cron auth: `CRON_SECRET` or `CRON_JOBS_USERNAME` + `CRON_JOBS_PASSWORD`
- 定时任务鉴权：`CRON_SECRET` 或 `CRON_JOBS_USERNAME` + `CRON_JOBS_PASSWORD`

- Storage: `STORAGE_*`
- 存储：`STORAGE_*`

## Core Product Invariants

## 核心产品不变量


### 1. Auth and signup

### 1. 认证与注册

- Better Auth is configured in `lib/auth.ts`.
- Better Auth 的配置在 `lib/auth.ts`。

- New signups receive a 300 credit registration bonus in the auth hook.
- 新用户注册时，会在 auth hook 中获得 300 积分注册奖励。

- If you change signup behavior, preserve the registration bonus flow unless the product decision explicitly changes it.
- 如果你修改注册流程，除非产品决策明确要求改变，否则要保留这个注册送积分流程。

- Google OAuth is optional now. It is enabled only when both `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` are present.
- Google OAuth 现在是可选能力。只有同时存在 `AUTH_GOOGLE_ID` 和 `AUTH_GOOGLE_SECRET` 时才启用。

- The login and signup forms should stay in sync with the server config: if the provider is disabled, the Google button should not render.
- 登录和注册表单要和服务端配置保持一致：如果提供方被禁用，就不应该渲染 Google 按钮。

### 2. Credits and ledger integrity

### 2. 积分与账本一致性

- `user.credits` is the fast balance.
- `user.credits` 是快速余额。

- `credit_ledger` is the audit trail.
- `credit_ledger` 是可审计流水。

- Any credit mutation should update both, ideally in one transaction.
- 任何积分变动都应该同时更新这两处，最好放在同一个事务中完成。

- Chat currently costs 10 credits, image generation 20 credits, and video generation 50 credits.
- 当前聊天消耗 10 积分，图片生成消耗 20 积分，视频生成消耗 50 积分。

- Paid AI routes use `createCreditCompensation(...)` to refund credits if provider work fails after deduction. Preserve that pattern.
- 付费 AI 路由使用 `createCreditCompensation(...)`，在扣费后如果调用提供方失败，就触发积分退款。要保留这个模式。

### 3. Billing and subscriptions

### 3. 计费与订阅

- Plan keys and pack keys only come from `constants/billing.ts`.
- plan key 和 pack key 只能来自 `constants/billing.ts`。

- Creem webhook processing lives in `app/api/payments/creem/webhook/route.ts`.
- Creem webhook 处理逻辑位于 `app/api/payments/creem/webhook/route.ts`。

- Annual plans use `subscription_credit_schedule` installments and are granted by `app/api/cron/subscription-grants/route.ts`.
- 年付计划通过 `subscription_credit_schedule` 分期发放积分，发放入口在 `app/api/cron/subscription-grants/route.ts`。

- If you touch subscription logic, keep these records aligned:
  `user.planKey`, `payment`, `subscription`, `credit_ledger`, and `subscription_credit_schedule`.
- 如果你修改订阅逻辑，必须保证这些记录保持一致：
  `user.planKey`、`payment`、`subscription`、`credit_ledger` 和 `subscription_credit_schedule`。

- The admin subscription mutation endpoint is intentionally simple right now and only updates `user.planKey`. Do not assume that is sufficient for a real subscription migration.
- 管理后台的订阅修改接口当前是刻意保持简单的，它只更新 `user.planKey`。不要误以为这已经足够支撑真实的订阅迁移。

### 4. AI generation flows

### 4. AI 生成功能流程

- Chat route: `app/api/chat/route.ts`
- 聊天路由：`app/api/chat/route.ts`

- Image route: `app/api/image/generate/route.ts`
- 图片生成路由：`app/api/image/generate/route.ts`

- Video route: `app/api/video/generate/route.ts`
- 视频生成路由：`app/api/video/generate/route.ts`

- Video status route: `app/api/video/status/route.ts`
- 视频状态路由：`app/api/video/status/route.ts`

Important behavior:  
重要行为说明：

- Image generation is currently image-to-image only. The route requires both `prompt` and `imageUrl`.
- 图片生成当前仅支持图生图。这个路由必须同时传入 `prompt` 和 `imageUrl`。

- Video generation supports prompt-only or image-to-video input.
- 视频生成支持纯 prompt，也支持图生视频输入。

- Generation history is persisted in `generation_history`.
- 生成历史会持久化到 `generation_history` 表中。

- If provider output is mirrored into R2 and that upload fails, the code often falls back to the provider URL instead of hard-failing.
- 如果提供方输出被镜像到 R2 时上传失败，代码通常会回退为使用提供方原始 URL，而不是直接硬失败。

### 5. Upload and storage behavior

### 5. 上传与存储行为

- User uploads enter through `app/api/upload/image/route.ts`.
- 用户上传入口在 `app/api/upload/image/route.ts`。

- Provider-generated media mirroring uses `lib/r2-storage.ts`.
- 提供方生成媒体的镜像逻辑使用 `lib/r2-storage.ts`。

- If storage is not configured:
- 如果对象存储没有配置：

  - upload route may return a data URL for testing
  - 上传路由可能会返回 data URL，供测试使用

  - provider result mirroring may return the original provider URL
  - 提供方结果镜像可能会直接返回提供方原始 URL

- Be careful when changing this behavior because demos and tests rely on graceful fallbacks.
- 修改这块行为时要特别小心，因为 demo 和测试都依赖这些“优雅回退”逻辑。

### 6. i18n

### 6. 国际化

- Locales are defined in `i18n.config.ts`.
- 语言列表定义在 `i18n.config.ts`。

- Locale routing is handled by `proxy.ts`.
- 语言路由由 `proxy.ts` 处理。

- Translation loading is in `lib/i18n.ts`.
- 翻译加载逻辑在 `lib/i18n.ts`。

- The app URL strategy is `as-needed`, so default-locale routes use `/docs`, `/pricing`, etc. rather than `/en/...`.
- 应用 URL 策略是 `as-needed`，因此默认语言使用 `/docs`、`/pricing` 这类路径，而不是 `/en/...`。

- When changing user-facing copy, update both English and Chinese unless the task explicitly says otherwise.
- 修改面向用户的文案时，除非任务明确要求，否则要同时更新英文和中文。

- If you change SEO copy, update `messages/seo.en.json` and `messages/seo.zh.json` too.
- 如果修改了 SEO 文案，也要同时更新 `messages/seo.en.json` 和 `messages/seo.zh.json`。

### 7. Docs site

### 7. 文档站

- The product ships an integrated docs site at `/docs` and `/zh/docs`.
- 产品自带一个集成文档站，路径分别是 `/docs` 和 `/zh/docs`。

- Docs content lives in `content/docs/**/*.mdx`.
- 文档内容位于 `content/docs/**/*.mdx`。

- Docs routing and rendering live in `app/[locale]/docs/*`.
- 文档站的路由和渲染逻辑位于 `app/[locale]/docs/*`。

- `lib/source.ts` reads from generated `.source/*` output created by `fumadocs-mdx`.
- `lib/source.ts` 会读取 `fumadocs-mdx` 生成的 `.source/*` 输出。

- `public/fumadocs-style.css` is generated. Do not hand-edit it; update the sync script or upstream dependency instead.
- `public/fumadocs-style.css` 是生成文件。不要手工修改它，而应该修改同步脚本或上游依赖。

## Current Known Gotchas

## 当前已知注意事项

- Some API routes still emit known dynamic server usage warnings during `pnpm build`, especially:
- 一些 API 路由在执行 `pnpm build` 时仍会出现已知的 dynamic server usage 警告，尤其包括：
  - `/api/auth/verify-email`
  - `/api/auth/verify-email`
  - `/api/auth/verify-reset-token`
  - `/api/auth/verify-reset-token`
  - `/api/newsletter/unsubscribe`
  - `/api/newsletter/unsubscribe`
  - `/api/user/admin-status`
  - `/api/user/admin-status`
  - `/api/user/credits/history`
  - `/api/user/credits/history`

- If you touch routes that read `request.url`, `headers`, cookies, or auth state, consider explicitly marking them dynamic.
- 如果你修改了会读取 `request.url`、`headers`、cookies 或认证状态的路由，考虑显式将它们标记为 dynamic。

- `app/api/upload/simple/route.ts` is demo-oriented and not the main production upload path.
- `app/api/upload/simple/route.ts` 更偏向 demo，不是主生产上传路径。

- Demo assets were intentionally localized into `public/starter`. Do not switch them back to `offerget` or other third-party runtime URLs.
- demo 资源是特意本地化到 `public/starter` 目录的。不要再改回 `offerget` 或其他第三方运行时 URL。

- Fumadocs ships Tailwind v4-oriented CSS, so the repo deliberately syncs that stylesheet into `public/` and loads it via `<link>` to avoid Tailwind v3/PostCSS conflicts.
- Fumadocs 提供的是偏 Tailwind v4 的 CSS，因此仓库特意把这份样式同步到 `public/`，再通过 `<link>` 加载，以避免和 Tailwind v3/PostCSS 冲突。

- Turbopack can still feel heavy on some macOS setups. Prefer `pnpm dev:webpack` if local development becomes sluggish.
- 在某些 macOS 环境里，Turbopack 仍然可能比较重。如果本地开发变卡，优先使用 `pnpm dev:webpack`。

## Testing Expectations

## 测试期望

Run the smallest useful set, but do verify your changes:  
尽量只跑最小但有效的验证集，但一定要验证你的修改：

- `pnpm lint`:
  run for any UI, route, config, or translation change
- `pnpm lint`：
  适用于任何 UI、路由、配置或翻译改动

- `pnpm test`:
  run for logic changes in billing, auth, credits, email, sessions, or utilities
- `pnpm test`：
  适用于计费、认证、积分、邮件、session 或工具函数逻辑改动

- `pnpm build`:
  run when touching routing, middleware, auth, next config, env-sensitive code, or server routes
- `pnpm build`：
  适用于修改路由、中间件、认证、Next 配置、依赖环境变量的代码或服务端路由

Current test coverage is concentrated in:  
当前测试覆盖主要集中在：

- `tests/components/*`
- `tests/components/*`
- `tests/constants/*`
- `tests/constants/*`
- `tests/lib/*`
- `tests/lib/*`

If you change billing, email, auth, or credit logic, add or update tests in `tests/lib`.  
如果你修改了计费、邮件、认证或积分逻辑，请在 `tests/lib` 中新增或更新测试。

## Contributor Advice By Area

## 分领域贡献建议

### Marketing and docs

### 营销与文档

- Keep README, `AGENTS.md`, and `.env.example` aligned with the actual code.
- 保持 README、`AGENTS.md` 和 `.env.example` 与实际代码一致。

- Use real repo paths in docs. Do not reference missing files or imaginary folders.
- 文档里要使用真实存在的仓库路径。不要引用缺失文件或虚构目录。

- If you update product positioning, double-check marketing copy in both locales.
- 如果你更新了产品定位，请重新检查两种语言下的营销文案。

### Admin features

### 后台功能

- Treat admin mutations as high-risk.
- 把后台修改操作视为高风险改动。

- Changing a user balance is not the same thing as changing the ledger.
- 修改用户余额，不等于修改了账本。

- Changing a plan label is not the same thing as changing a subscription state.
- 修改 plan 标签，不等于修改了订阅状态。

### Billing

### 计费

- Never invent plan keys.
- 绝对不要自己发明新的 plan key。

- Never grant credits outside the ledger path unless you are intentionally repairing historical data.
- 除非你是在有意识地修复历史数据，否则不要绕开账本路径直接发积分。

- Preserve webhook idempotency.
- 保持 webhook 的幂等性。

### Generated content and assets

### 生成内容与资源文件

- Blog MDX is source content.
- 博客 MDX 是源内容。

- `lib/blog-manifest.generated.ts` is derived output.
- `lib/blog-manifest.generated.ts` 是派生输出文件。

- `public/starter` contains committed local demo assets.
- `public/starter` 包含已提交到仓库的本地 demo 资源。

- `.asset-sources/starter-demo` contains source stills for the committed local demo videos.
- `.asset-sources/starter-demo` 包含这些已提交 demo 视频所对应的源图片。

## Preferred Change Style

## 推荐修改风格

- Make the smallest change that preserves product truth.
- 用最小的改动去维护产品真实逻辑。

- Favor explicit invariants over convenience.
- 优先保证显式不变量，而不是图省事。

- If a route has environment-dependent fallbacks, document that behavior in code comments when you change it.
- 如果某个路由存在依赖环境的回退行为，你在修改它时应在代码注释里写清楚。

- If you discover a mismatch between UI copy, README, and code, fix the mismatch rather than leaving "TODO" drift behind.
- 如果你发现 UI 文案、README 和代码之间不一致，应当直接修正这种不一致，而不是留下“TODO”继续漂移。

## Before You Finish

## 结束前检查

Before wrapping a task, check:  
在结束任务前，请检查：

1. Did you keep credits, billing, and subscription state internally consistent?
1. 你是否保持了积分、计费和订阅状态的内部一致性？

2. Did you update both locales if user-facing copy changed?
2. 如果改了面向用户的文案，你是否同步更新了两种语言？

3. Did you avoid reintroducing external runtime demo assets?
3. 你是否避免重新引入外部运行时 demo 资源？

4. Did you run the right validation commands for the area you touched?
4. 你是否针对改动范围运行了正确的验证命令？

5. Did you leave generated files and docs in sync with the codebase?
5. 你是否让生成文件和文档与代码库保持同步？

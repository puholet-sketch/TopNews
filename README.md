# TopNews

**Сайт:** https://puholet-sketch.github.io/TopNews/

## Диагностика поломки 17.08.2026

Сбор RSS **не падал**. Упал GitHub Pages:

`deploy-pages` → HTTP **503** «No server is currently available».

Из-за этого весь workflow «Update news feed» был красным, хотя `npm run collect` и коммит `data/news.json` прошли успешно.

Дополнительно:
- `updatedAt` перезаписывался даже когда все 20 категорий **пропускались** по интервалу — казалось, что лента обновилась вхолостую.
- Ошибки отдельных RSS глотались, job всё равно был green.
- Коммиты `GITHUB_TOKEN` не запускают `deploy.yml`, поэтому деплой должен жить в collect-workflow, но **отдельным job**, чтобы 503 Pages не маскировался под «сломанный сбор».

## Что сделано

- Collect и Deploy разделены: сбор остаётся green при сбое Pages.
- Ретраи deploy-pages (3 попытки) на 503.
- `npm run health:strict` — диагностика в `data/health.json`, CI падает при критичных проблемах ленты.
- `updatedAt` меняется только если реально обновлены категории.
- Резервные RSS + фиксация протухшей ленты «Путешествия».

## Запуск

```bash
npm install
npm run collect:force
npm run health:strict
npm run dev
```

## Workflows

| Workflow | Когда | Что делает |
|----------|-------|------------|
| `collect-news.yml` | каждые 2 ч | collect → health → commit → deploy (с ретраями) |
| `deploy.yml` | push кода | build → deploy (с ретраями) |

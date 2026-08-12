# TopNews

**Сайт:** https://puholet-sketch.github.io/TopNews/

## Почему «ломалась» сборка

1. **Сайт не обновлялся** — `collect-news` коммитил `data/news.json`, но коммиты от `GITHUB_TOKEN` не запускают другие workflow. Деплой последний раз был 26 июля, хотя новости в репозитории обновлялись каждые 2 часа.
2. **Исправление** — `collect-news.yml` теперь собирает новости, коммитит и **сразу деплоит** на GitHub Pages в одном workflow.

## Запуск

```bash
npm install
npm run collect:force
npm run dev
```

## Workflows

| Workflow | Когда | Что делает |
|----------|-------|------------|
| `collect-news.yml` | каждые 2 ч | collect → commit → build → deploy |
| `deploy.yml` | push в main | collect:force → build → deploy (при изменениях кода) |

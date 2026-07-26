# TopNews

Автоагрегатор топ-новостей на **русском**: **20 тем × 5 новостей**.

**Сайт:** https://puholet-sketch.github.io/TopNews/

## Почему не было картинок

RSS многих источников (МедРоссия, агентства) не отдают `media:`/`enclosure`. Теперь сборщик:
1. берёт картинку из RSS;
2. если нет — парсит `og:image` / `twitter:image` со страницы;
3. в UI есть SVG-fallback, чтобы сетка не ломалась.

## Запуск

```bash
cd D:\TopNews
npm install
npm run collect:force
npm run dev
```

## Автономность

| Workflow | Расписание | Действие |
|----------|------------|----------|
| `collect-news.yml` | каждые 2 часа | обновляет `data/news.json` |
| `deploy.yml` | push в `main` | collect:force → build → GitHub Pages |

## UI

Редакционная витрина (BBC / Reuters / The Verge): светлая палитра, serif-заголовки, lead + side stack, тематические блоки, мобильное меню, relative time.

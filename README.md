# TopNews

Автоматический агрегатор топ-новостей: **20 тем × 5 новостей** из ведущих RSS-источников (IT → медицина).

## Источники (20 тем)

| Тема | Источник | Интервал |
|------|----------|----------|
| IT | TechCrunch | 4ч |
| AI | MIT Technology Review | 6ч |
| Кибербезопасность | Krebs on Security | 12ч |
| Бизнес | CNBC | 2ч |
| Стартапы | VentureBeat | 4ч |
| Наука | Phys.org | 6ч |
| Медицина | FDA News | 4ч |
| Здоровье | WHO News | 6ч |
| Экология | The Guardian | 4ч |
| Энергетика | OilPrice | 6ч |
| Космос | Space.com | 6ч |
| Авто | Car and Driver | 6ч |
| Игры | Rock Paper Shotgun | 4ч |
| Развлечения | Variety | 4ч |
| Спорт | ESPN | 2ч |
| Политика | NPR World | 2ч |
| Образование | EdSurge | 8ч |
| Право | NPR Law | 12ч |
| Недвижимость | Curbed | 8ч |
| Путешествия | Skift | 8ч |

## Быстрый старт

```bash
cd D:\TopNews
npm install
npm run collect    # собрать новости
npm run dev        # сайт на http://localhost:3000
npm run build      # production-сборка
```

## Публикация (GitHub Pages)

Сайт: **https://puholet-sketch.github.io/TopNews/**

При каждом push в `main` GitHub Actions:
1. Собирает свежие новости (`npm run collect`)
2. Собирает сайт и публикует на GitHub Pages

Отдельный workflow `collect-news.yml` обновляет `data/news.json` каждые 2 часа.

## Автоматизация Cursor

Автоматизация Cursor — опционально, если хотите PR через cloud agent.
Черновик: `.cursor/automation-topnews.json`

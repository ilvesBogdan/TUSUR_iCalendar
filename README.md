# TUSUR Schedule Sync

**TUSUR Schedule Sync** — это парсер расписания занятий ТУСУРа, который позволяет интегрировать расписание университетских занятий в ваш Google Календарь в формате iCalendar.

## Пример использования

Для получения расписания используйте следующую ссылку:

```plaintext
https://example.ru/fvs_590-1?weeks=2&not=УПДУПД4&not=СПРБП
```

- `fvs` — факультет.
- `590-1` — номер группы.
- `weeks=2` — количество недель, на которые нужно получить расписание.
- `not=УПДУПД4` и `not=СПРБП` — предметы, которые нужно исключить из расписания.

## Установка и запуск на сервере

### Требования

- Node.js (версии 18.x или выше)
- Yarn
- Docker (опционально)

### Установка и запуск без Docker

1. **Склонируйте репозиторий:**
    ```bash
    git clone https://github.com/ilvesBogdan/TUSUR_iCalendar.git
    cd tusur-schedule-sync
    ```

2. **Установите зависимости:**
    ```bash
    yarn install
    ```

3. **Скомпилируйте TypeScript:**
    ```bash
    yarn run tsc
    ```

4. **Запустите приложение:**
    ```bash
    yarn start
    ```

    Приложение будет доступно по адресу `http://localhost:3000`.

### Установка и запуск с Docker

1. **Склонируйте репозиторий:**
    ```bash
    git clone https://github.com/ilvesBogdan/TUSUR_iCalendar.git
    cd tusur-schedule-sync
    ```

2. **Соберите Docker-образ:**
    ```bash
    docker build -t tusur-schedule-sync .
    ```

3. **Запустите контейнер:**
    ```bash
    docker run -d -p 3000:3000 tusur-schedule-sync
    ```

    Приложение будет доступно по адресу `http://localhost:3000`.

## Использование

После запуска приложения можно получить расписание, подставив необходимые параметры в URL. Например:

```plaintext
http://localhost:3000/fvs_590-1?weeks=2
```

Этот запрос вернёт расписание группы `590-1` факультета `fvs` на две недели, в формате iCalendar, который можно добавить в Google Календарь.
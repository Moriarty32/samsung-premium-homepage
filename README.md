# Online Samsung — премиальный концепт главной страницы

[Открыть демонстрацию](https://moriarty32.github.io/samsung-premium-homepage/)

Адаптивный статический редизайн для [online-samsung.ru](https://online-samsung.ru/). Это демонстрационная страница. Цены из исходного референса не являются офертой. Реальный каталог и оформление заказа доступны по ссылкам магазина.

## Дизайнерский аудит и внедрённые рекомендации

Аудит проведён 6 ноября 2026 года. В качестве ориентиров изучены [Apple iPhone](https://www.apple.com/iphone/), [Samsung](https://www.samsung.com/us/), [Bang & Olufsen](https://www.bang-olufsen.com/en/int) и действующий сайт клиента. Приведённые ниже рекомендации — дизайнерские выводы из сравнения, а не обязательные правила этих брендов.

Для этой страницы премиальный характер создают точная сетка, спокойная иерархия, качественное изображение товара, ограниченная палитра и предсказуемые взаимодействия. Декоративные эффекты подчинены содержанию.

| Найденный недостаток | Внедрённое решение |
| --- | --- |
| Боковые полосы экосистемы на широком мониторе: высота ограничивалась 600 px, а фон 3:1 размещался через `contain` | Фон принадлежит секции и всегда белый. Устройства — отдельное прозрачное изображение в сетке, без фонового прямоугольника |
| Белые зазоры 12–18 px между рекламными секциями | Внешние отступы между Fold, экосистемой и ТВ удалены. Пространство организовано внутри секций |
| При анимации двигался весь окрашенный блок, открывая полосу фона | Появляются только текст и предметные изображения; поверхности секций остаются неподвижными |
| Смешение синего, лилового, розового и холодного серого в интерфейсе | Единая палитра: белый, нейтральный светло-серый, графит. Цвет сохранён в товарах и интерьерной фотографии |
| Три конфликтующих слоя CSS и резкие скачки высоты на промежуточных ширинах | Один файл `design.css`, общая сетка и последовательное перестроение колонок |
| Неодинаковые начертания, слишком крупный тонкий заголовок экосистемы | Сохранены логотип клиента и SamsungSharp Regular/Bold. Общая шкала заголовков, текста и управляющих элементов |
| У сгенерированных товаров были ореолы и несоответствия внешнему виду моделей | Смартфон, Galaxy Watch Ultra и Galaxy Buds4 Pro заменены чистыми изображениями из галерей клиента |
| Разный оптический размер товаров и случайный перенос стрелок | Настроены зоны изображений, безопасные поля, единое положение стрелок и индивидуальный масштаб смартфона |
| В мобильном слайде обрезался край телевизора | Изображение получило отдельную верхнюю область с сохранением телевизора целиком |
| Разная высота сервисных карточек на телефоне | Единый минимальный размер и согласованные отступы |
| Изображение камеры мешало тексту в карточке поддержки | Фотография ограничена правой областью; цветовой оттенок нейтрализован, текст имеет отдельную безопасную зону |
| Слишком заметные прыжки и масштабирование при наведении | Подъём кнопки на 2 px, аккуратное движение стрелок, умеренное увеличение товарных изображений |
| Автоматическая карусель не имела явной паузы | Добавлена пауза; смена останавливается вне экрана, при наведении и фокусе. Учтён `prefers-reduced-motion` |

## Правила дальнейшего развития

- Оставлять фон интерфейса нейтральным; новый цвет вводить только с конкретной функцией.
- Использовать фон секции и отдельный товарный слой для предметных баннеров. Не подгонять фотографию под произвольную высоту растяжением.
- Для карточек конкретных моделей использовать проверенные товарные изображения. Генерацию применять к рекламным сценам.
- Сохранять одну сетку контента до 1440 px, одну систему отступов и одинаковые размеры кнопок.
- Проверять не только телефон и ноутбук, но также 1920–2560 px и ширины вокруг точек перестроения.
- Новые эффекты не должны двигать цветные поверхности, перекрывать текст или усложнять выбор товара.

## Изображения

| Файл | Размер | Происхождение |
| --- | --- | --- |
| `assets/ecosystem-cutout.webp` | 1448×1086, прозрачность | Новая генерация предметной группы |
| `assets/fold-cutout.webp` | 1254×1254, прозрачность | Новая генерация Fold |
| `assets/catalog-phone.webp` | 1200×800 | [Галерея Galaxy S26 Ultra](https://online-samsung.ru/product/sm-s948bzvbcau), изображение `SM-S948BZVBCAU_15.png` |
| `assets/catalog-watch.webp` | 1200×800 | [Галерея Galaxy Watch Ultra](https://online-samsung.ru/product/sm-l705fzb1cau), `SM-L705FZB1CAU_1-min_0.png` |
| `assets/catalog-buds.webp` | 1200×1200 | [Галерея Galaxy Buds4 Pro](https://online-samsung.ru/product/sm-r640nzkacis), `SM-R640NZKACIS_7.png` |
| `assets/journal-watch.webp` | 1200×1200 | Галерея Galaxy Watch Ultra, `SM-L705FZB1CAU__15-min.png` |

Остальные рекламные изображения и изображения категорий сохранены из предыдущей версии. WebP экспортированы с сохранением пропорций и прозрачности. Исходные генерации сохранены в каталоге Codex generated_images; используемые файлы находятся в репозитории.

<details>
<summary>Промпты новых изображений</summary>

Использован встроенный инструмент `image_gen`, режим редактирования, `transparent_background: true`.

**Экосистема.** Референс: предыдущая мобильная сцена экосистемы.

> Edit target: the attached ecosystem product scene. Create a premium photorealistic isolated product group for a website, landscape 4:3 canvas. Preserve the general grouping and identity: thin television at rear, silver flagship phone with separate camera rings, landscape tablet in front, black round watch and silver earbud case; keep every device fully inside frame, complete silhouette, natural size relationships. Refine hardware geometry and glass edges. Replace the lavender environment, glowing arc and floor with GENUINE TRANSPARENCY. A very low neutral white oval plinth may remain beneath the devices, with soft natural contact shadows and no broad opaque floor. Screens use quiet dark graphite and subdued violet abstract light, not neon. Silver hardware, neutral daylight studio reflections. Group fills 90% of width and 85% of height, safe margins all around. No text, no typography, no logos, no border, no background rectangle. This will be placed directly on a white HTML section.

**Fold.** Референс: предыдущая мобильная сцена Fold.

> Edit target: the attached foldable smartphone scene. Create a premium photorealistic isolated product group, square canvas, for a website product campaign. Keep the arrangement of a closed graphite phone showing three camera rings behind a second unfolded phone showing its flexible screen, thin refined metal edges. Both phones completely visible with comfortable safe margins. Replace all lavender studio background, glowing floor and reflection with GENUINE TRANSPARENCY, retain only subtle soft contact shadows under the phones. Screen is a restrained deep midnight blue abstract ribbon of light, avoid electric neon. Correct elegant premium hardware geometry, high detail, realistic studio photography. Group occupies about 85% of frame. No text, logos, watermark, border, background or podium. Will sit on a neutral light-gray HTML background.

</details>

## Проверка

В Chrome проверены 320, 390, 768, 1024, 1440, 1920 и 2560 px. Нет горизонтального переполнения, не загруженных изображений и ошибок JavaScript. Зазоры между Fold, экосистемой и ТВ равны нулю. Просмотрены все слайды и раскрытый FAQ; проверены меню, поиск и пауза карусели. Изображения товаров не деформируются.

## Локальный запуск

```bash
python -m http.server 4173
```

Открыть `http://localhost:4173/`. Сборка и зависимости не требуются.

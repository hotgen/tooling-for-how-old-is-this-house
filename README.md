# Tooling for adding new cities to [how-old-is-this.house](https://how-old-is-this.house/en)

🚧🚧🚧 **WORK IN PROGRESS** 🚧🚧🚧

This repository contains commands for assembling a dataset with building ages for a specified area.
The commands collect data from various publicly available sources, process it and combine together into a single map layer.

Because [how-old-is-this.house](https://how-old-is-this.house/en) focuses on cities in Russia, the instructions below are in Russian.
Although some of the data sources are country-specific, parts of the repo can still be recycled for a global re-use.

👀 [English version on Google Translate](https://translate.google.com/translate?sl=ru&tl=en&u=https://github.com/kachkaev/tooling-for-how-old-is-this-house/blob/main/README.md)

---

## Источники данных

🔢 данные, попадающие в финальный набор (цифра означает приоритет)  
⏳ временно используемые вспомогательные данные  
🗑 данные игнорируются из-за редкости или низкого качества

📍 точка (point)  
🟥 контур (polygon / multipolygon)

<!-- prettier-ignore-start -->

| | адрес | геометрия | год постройки | название | 🔗 Википедия | фотография |
| :- | :-: | :-: | :-: | :-: | :-: | :-: |
| **[МинЖКХ](https://mingkh.ru)**           | 3️⃣ | ⏳ 📍 | 2️⃣ |
| **[Минкульт](https://opendata.mkrf.ru)**  | 1️⃣ | ⏳ 📍 | 1️⃣ | 1️⃣ |   | 1️⃣ |
| **[ОСМ](https://www.openstreetmap.org)**  | 2️⃣ | 1️⃣ 🟥 | 4️⃣ | 2️⃣ | 1️⃣ |
| **[Росреестр](https://rosreestr.gov.ru)** | 4️⃣ | ⏳ 📍 | 3️⃣ |
| **[Викимапия](https://wikimapia.org)**    | 🗑 | ⏳ 🟥 |   | 🗑 | 🗑 | 2️⃣ |

<!-- prettier-ignore-end -->

## Инструкции

Чтобы выполнить приведённые ниже шаги, вам понадобятся:

- базовое понимание [командной строки](https://ru.wikipedia.org/wiki/Интерфейс_командной_строки) (терминала),
- небольшой опыт работы с [гитом](https://ru.wikipedia.org/wiki/Git) (системой контроля версий),
- поверхностное знакомство с форматами [GeoJSON](https://ru.wikipedia.org/wiki/GeoJSON) и [YAML](https://ru.wikipedia.org/wiki/YAML).

В качестве текстового редактора рекомендуется [VSCode](https://code.visualstudio.com) с плагинами
[DotENV](https://marketplace.visualstudio.com/items?itemName=mikestead.dotenv),
[Geo Data Viewer](https://marketplace.visualstudio.com/items?itemName=RandomFractalsInc.geo-data-viewer),
[Git Graph](https://marketplace.visualstudio.com/items?itemName=mhutchie.git-graph),
[Git Lens](https://marketplace.visualstudio.com/items?itemName=eamodio.gitlens) и
[Yaml](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml).
Для визуализации полученных данных подойдёт любая геоинформационная программа, например, [QGIS](https://qgis.org/ru/site/).

В упоминаемых папках и файлах `/path/to` условно обозначает локальную папку, выделенную под проект.
Например, если на вашем компьютере это `/Users/me/projects/how-old-is-this-house`, то `/path/to/some-folder` означает `/Users/me/projects/how-old-is-this-house/some-folder`.

### Требования к системе

Для запуска команд подойдёт любой относительно современный компьютер с любой операционной системой (Linux, macOS, Windows).
Для обработки территории с населением порядка миллиона человека хватит 2-4 ГБ оперативной памяти и в районе 200-400 МБ свободного места на диске.
Скорее всего, бутылочным горлышком будет пропускная способность интернета и ограничения, которые накладывают источники на скорость скачивания данных.

### Настройка команд

Эти шаги достаточно выполнить один раз, даже если вы планируете сбор данных для нескольких территорий.

1.  Убедиться, что на машине установлены [гит](https://git-scm.com/) (система контроля версий) и [нода](https://nodejs.org/ru/) (среда запуска команд).
    При установке ноды рекомендуется выбрать версию LTS.

    Команды для проверки установки:

    ```sh
    git --version
    ## покажет ≥ 2.30
    
    node --version
    ## покажет ≥ 14.16
    ```

1.  Установить последнюю версию [ярна](https://yarnpkg.com) (менеджера зависимостей):

    ```sh
    npm install --global yarn
    ```

    Команда для проверки установки:

    ```sh
    yarn --version
    ## покажет ≥ 1.22
    ```

1.  [Клонировать](https://docs.github.com/en/github/creating-cloning-and-archiving-repositories/cloning-a-repository) этот репозиторий в папку `/path/to/tooling`.

    Если результат оказался в другой папке, например, `/path/to/tooling-for-how-old-is-this-house` или `/path/to/tooling/tooling-for-how-old-is-this-house`, то папку можно перенести.
    Связь с Гитхабом при этом не потеряется.
    В качестве самопроверки убедитесь, что на вашем компьютере существует файл `/path/to/tooling/README.md`.

1.  Открыть терминал, перейти в папку `/path/to/tooling`:

    ```sh
    cd "/path/to/tooling"
    ```

    Название этой папки должно появиться слева от места ввода команды.

1.  Будучи в папке `/path/to/tooling`, установить зависимые библиотеки:

    ```sh
    yarn install
    ```

    Это займёт пару минут.

1.  Будучи в папке `/path/to/tooling`, создать пустой файл `.env.local` и заодно проверить общую работоспособность команд:

    ```sh
    yarn exe src/commands/ensureDotEnvLocal.ts
    ```

    Если возникает ошибка, следует заново пройтись по инструкции (видимо, что-то пропустили).

### Подготовка данных Минкульта

Этот раздел можно пропустить, если вы присоединяетесь к работе над территорией, которую уже начал кто-то другой.

Нижеперечисленные шаги достаточно выполнить один раз, даже если вы планируете сбор данных для нескольких территорий.

1.  Скачать список объектов с сайта Министерства Культуры РФ:  
    <https://opendata.mkrf.ru/opendata/7705851331-egrkn>

    Ссылка на архив — в правом верхнем углу страницы.
    Файл должен быть в формате `jsons` (с `s` на конце).

1.  Разархивировать скаченный файл и поместить его в папку `/path/to/data/sources/mkrf`.
    Название файла желательно не менять.

    > 🚩 **Пользователям macOS**  
    > Встроенная программа для распаковки архивов отрезает у файла хвост.
    > Чтобы этого избежать, откройте папку со скаченным архивом в терминале и распакуйте его командой `unzip`:
    >
    > ```sh
    > unzip data-50-structure-6.jsons.zip -d .
    > ```

1.  Открыть файл `/path/to/tooling/.env.local` как текстовый и указать переменную `MKRF_JSONS_DUMP_FILE_PATH`.
    Она указывает путь к скаченному файлу.
    Файл `.env.local` станет выглядеть примерно так:

    ```ini
    MKRF_JSONS_DUMP_FILE_PATH=../data/sources/mkrf/data-50-structure-6.jsons
    ```

    В пути к файлу может быть другая цифра вместо `50`.
    Она означает версию данных.

1.  Будучи в папке `/path/to/tooling`, проверить выполнение предыдущих шагов:

    ```sh
    yarn exe src/commands/2-sources/mkrf/0-checkJsonsDump.ts
    ```

### Подготовка территории

Команды могут запускаться для любой части РФ.
Рекомендуется ограничиваться компактной территорией, например, одной городской агломерацией.
Из-за особенностей процесса получения данных, попытка за раз охватить большую, но при этом малонаселённую территорию, будет неэффективной.

Созданные в рамках этого проекта данные желательно хранить в гит-репозитории.
Это позволяет отслеживать изменения в файлах, делать их резервные копии и совместно работать над общими территориями.
Репозиторий с данными и репозиторий с кодом команд развиваются и хранятся отдельно друг от друга.

Перед выполнением шагов в этом разделе вам надо получить доступ к репозиторию с данными.
Для вас будет создана новая гит-ветка из специальной ветки-шаблона `territories/_blank`.
После этого надо:

1.  Создать локальную папку `/path/to/data/territories`.

1.  Клонировать соответствующую ветку репозитория с данными в папку `/path/to/data/territories/TERRITORY_NAME`.

    `TERRITORY_NAME` — это название города или части субъекта РФ (например, `penza` или `penza_oblast_kuznetsk`).
    Название папки соответствует названию ветки репозитория (`territories/TERRITORY_NAME`).

1.  Открыть файл `/path/to/tooling/.env.local` как текстовый и указать путь к выбранной территории.
    Это делается добавлением такой строчки:

    ```ini
    TERRITORY_DATA_DIR_PATH=../data/territories/TERRITORY_NAME
    ```

    Часть `TERRITORY_NAME` надо заменить на реальное название папки.

1.  Если территория новая (то есть ещё не начата кем-то другим), заполнить файл `/path/to/data/territories/TERRITORY_NAME/territory-config.yml`.
    Этот ямл уже должен быть создан гитом.
    Внутри — комментарии с подсказками.

1.  Если территория новая, построить её границу согласно настройкам в `territory-config.yml` → `extent`:

    ```sh
    yarn exe src/commands/1-buildTerritoryExtent.ts
    ```

    Эта команда создаст файл `/path/to/data/territories/TERRITORY_NAME/territory-extent.geojson`.

    Вместо запуска команды, вы можете задать границу территории самостоятельно.
    Для этого достаточно самостоятельно сохранить любой объект `Polygon` в файл `territory-extent.geojson`.

    Желательно подбирать границы территории так, чтобы они повторяли контуры кадастровых кварталов.
    Это повысит эффективность работы с АПИ Росреестра.

1.  Закоммитить и запушить изменения в файлах `territory-config.yml` и `territory-extent.yml` при помощи гита.

    Этот шаг упростит дальнейшую работу над территорий и избавит вас от необходимости делать резервные копии данных.

### Получение и обработка данных для выбранной территории

Все нижеперечисленные команды выполняются из папки `/path/to/tooling`.
Перед их запуском важно выполнить инструкции в предыдущих разделах.

Команды выполняются по очереди сверху вниз.
Если у вас возникает проблема с одним из источников, вы можете по-прежнему запускать команды, которые не упоминают этот источник.
Например, если что-то пошло не так с Росреестром, достаточно начать игнорировать все последующие команды `src/commands/2-sources/rosreestr/*`, и можно продолжать.

Если вы совместно работаете с кем-то ещё над одной территорией, то вам можно будет пропустить некоторые команды.
Какие именно — зависит от того, что уже успели сделать до вас.

После запуска команд важно не забывать проверять статус локального гит-репозитория с данными: `/path/to/data/territories/TERRITORY_NAME`.

- Скаченные и обработанные исходные данные отображаются как изменения в репозитории.
  Эти файлы важно коммитить и пушить.

- Промежуточные и итоговые наборы данных дешевле перегенерировать локально, чем хранить в репозитории.
  Такие файлы перечислены в `/path/to/data/territories/TERRITORY_NAME/.gitignore`.
  Благодаря этой настройке вы не увидите изменений в гит-репозитории после запуска некоторых команд.

Потратив пару лишних минут на гит после запуска очередной команды, вы можете сэкономить себе несколько часов.
Благодаря гиту всегда есть возможность откатить данные до предыдущей версии, если что-то пошло не так.
Такая защита позволяет проводить любые эксперименты без страха что-то испортить или удалить.

Вот все шаги:

1.  **Собрать данные с МинЖКХ**

    ```sh
    yarn exe src/commands/2-sources/mingkh/1-fetchHouseLists.ts
    yarn exe src/commands/2-sources/mingkh/2-fetchRawHouseInfos.ts
    yarn exe src/commands/2-sources/mingkh/3-parseRawHouseInfos.ts
    ```

    Создание файла для анализа промежуточного результата (опционально):

    ```sh
    yarn exe src/commands/2-sources/mingkh/4-previewHouseInfos.ts
    ```

1.  **Извлечь данные из скаченного ранее дампа Минкульта**

    ```sh
    yarn exe src/commands/2-sources/mkrf/1-extractObjectsFromJsonsDump.ts
    ```

1.  **Собрать данные с ОСМ**

    Контуры зданий и административные границы:

    ```sh
    yarn exe src/commands/2-sources/osm/1-fetchBuildings.ts
    yarn exe src/commands/2-sources/osm/2-fetchBoundariesForRegions.ts
    yarn exe src/commands/2-sources/osm/3-fetchBoundariesForSettlements.ts
    ```

    Контуры водных объектов и дорог (опционально, понадобятся только для визуализации):

    ```sh
    yarn exe src/commands/2-sources/osm/4-fetchRailways.ts
    yarn exe src/commands/2-sources/osm/5-fetchRoads.ts
    yarn exe src/commands/2-sources/osm/6-fetchWaterObjects.ts
    ```

1.  **Собрать данные с Росреестра**

    Скачивание геопривязанных ОКС (объектов капитального строительства) и земельных участков:

    ```sh
    yarn exe src/commands/2-sources/rosreestr/1.1-fetchTilesWithCcos.ts
    yarn exe src/commands/2-sources/rosreestr/1.2-fetchTilesWithLots.ts
    ```

    Создание файла для анализа промежуточного результата (опционально):

    ```sh
    yarn exe src/commands/2-sources/rosreestr/2-previewTileData.ts
    ```

    Получение списков ОКС в кадастровых кварталах:

    ```sh
    yarn exe src/commands/2-sources/rosreestr/3-pickBlockFromTiles.ts
    yarn exe src/commands/2-sources/rosreestr/4-fetchCcoListsInPickedBlocks.ts
    ```

    > ↑ В некоторых кадастровых кварталах существуют «острова» номеров без единой географической отметки.
    > Такие «острова» не видно при сборе данных через тайлы.
    > Получить список всех ОКС внутри квартала не даёт АПИ, однако сканирование того, что доступно, позволяет найти прячущиеся «острова».
    > Это улучшает работу последующих команд.

    Подготовка к скачиванию деталей объектов:

    ```sh
    yarn exe src/commands/2-sources/rosreestr/5-generateObjectInfoPages.ts
    ```

    Скачивание деталей объектов из АПИ `fir_object`:

    ```sh
    yarn exe src/commands/2-sources/rosreestr/6-fetchObjectInfosFromFirApi.ts
    ```

    > ↑ Эта команда поддерживает многозадачность.
    > Вы можете открыть до десяти терминалов и запустить её в каждом окне, чтобы ускорить процесс.

    Скачивание деталей объектов АПИ ПКК, чтобы закрыть оставшиеся пробелы:

    ```sh
    yarn exe src/commands/2-sources/rosreestr/7-fetchObjectInfosFromPkkApi.ts
    ```

    > ↑ Эта команда не поддерживает многозадачность.
    > Запуск слишком большого числа запросов приводит к блокировке айпи-адреса.

    <!--
    Скачать данные с Викидаты:
    ```sh
    yarn exe src/commands/2-sources/wikidata/1-fetchRawRecords.ts
    ```
    Эта команда пока не доделана, потому что для Пензы было мало мало данных.
    -->

1.  **Собрать данные с Викимапии**

    Контуры объектов:

    ```sh
    yarn exe src/commands/2-sources/wikimapia/1-fetchTiles.ts
    ```

    Создание файла для анализа промежуточного результата (опционально):

    ```sh
    yarn exe src/commands/2-sources/wikimapia/2-previewTileData.ts
    ```

    Детали объектов:

    ```sh
    yarn exe src/commands/2-sources/wikimapia/3-fetchRawObjectInfos.ts
    yarn exe src/commands/2-sources/wikimapia/4-parseRawObjectInfos.ts
    ```

1.  **Создать каталог геокодов**

    Геокодирование — процесс связывания адреса объекта и его координат.
    У нас есть источники, где известен и адрес, и координаты зданий, а также источники, где координаты частично отсутствуют.
    Собрав каталог геокодов, мы уменьшим количество объектов без координат.

    ```sh
    yarn exe src/commands/2-sources/mingkh/8-reportGeocodes.ts
    yarn exe src/commands/2-sources/mkrf/8-reportGeocodes.ts
    yarn exe src/commands/2-sources/osm/8-reportGeocodes.ts
    yarn exe src/commands/2-sources/rosreestr/8-reportGeocodes.ts
    yarn exe src/commands/2-sources/wikimapia/8-reportGeocodes.ts
    ```

    Результат работы команд будет в папке `/path/to/data/territories/TERRITORY_NAME/geocoding`.
    Созданные файлы игнорируются гитом, поэтому команды следует выполнять каждый раз после клонирования или обновления репозитория с данными.

1.  **Заполнить пробелы в каталоге геокодов при помощи Яндекса**

    Полнота данных ОСМ на выбранной территории существенно влияет на количество пробелов в каталоге геокодов.
    Чтобы уменьшить зависимость от внешнего геокодера, попробуйте улучшить данные в ОСМ и потом скачать их заново.
    См. [пензенскую картовечеринку](https://wiki.openstreetmap.org/wiki/RU:Пенза/встречи) в качестве примера такого мини-проекта.

    Чтобы воспользоваться геокодером от Яндекса, вам потребуется ключ для их АПИ.
    Его получают на странице [developer.tech.yandex.ru/services](https://developer.tech.yandex.ru/services) (следует выбрать _JavaScript API и HTTP Геокодер_).
    Важно, чтобы у вас было разрешение кэшировать ответы сервера, иначе вы будете нарушать лицензионное соглашение.

    Ключ от АПИ надо добавить в файл `/path/to/tooling/.env.local`:

    ```ini
    YANDEX_GEOCODER_API_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    ```

    Обращение к геокодеру:

    ```sh
    yarn exe src/commands/2-sources/yandex/1-geocodeAddressesWithoutPosition.ts
    ```

    > ↑ В зависимости от лимита запросов для вашего ключа, вам может понадобиться несколько дней, чтобы закрыть все пробелы.
    > Можно продолжать, не дожидаясь полного геокодирования адресов, а потом вернуться к этому шагу.

    После получения геокодов из Яндекса следует добавить их в каталог:

    ```sh
    yarn exe src/commands/2-sources/yandex/8-reportGeocodes.ts
    ```

    Как и на предыдущем шаге, результат команды `*/8-reportGeocodes.ts` не попадает в гит-репозиторий.
    Значит, эту команду надо выполнить каждый раз при клонировании или обновлении репозитория с данными.

1.  **Подготовить слои для склейки**

    ```sh
    yarn exe src/commands/2-sources/mingkh/9-extractOutputLayer.ts
    yarn exe src/commands/2-sources/mkrf/9-extractOutputLayer.ts
    yarn exe src/commands/2-sources/osm/9-extractOutputLayer.ts
    yarn exe src/commands/2-sources/rosreestr/9-extractOutputLayer.ts
    yarn exe src/commands/2-sources/wikimapia/9-extractOutputLayer.ts
    ```

    Эти команды создадут файлы `/path/to/data/territories/TERRITORY_NAME/sources/*/output-layer.geojson`.
    Некоторые из них обращаются к каталогу геокодов, созданному ранее.
    Результат команд игнорируется гитом, потому что его дешевле перегенерировать, чем хранить.

1.  **Склеить слои**

    Этот финальный этап обработки данных смешивает файлы, которые мы получили на предыдущем шаге.

    Исходные слои выполняют одну из двух ролей: являются _базой_ (источником геометрии и характеристик) или _заплаткой_ (только источником характеристик).
    Роль базового слоя выполняет ОСМ, все остальные источники — заплатки.

    Смешивание базовых слоёв и заплаток:

    ```sh
    yarn exe src/commands/3-mixOutputLayers.ts
    ```

    Выбор финальных характеристик объектов из нескольких вариантов:

    ```sh
    ## 🚧 Логика смешивания данных пока что реализована грубо
    yarn exe src/commands/4-mixPropertyVariants.ts
    ```

1.  **Подготовить данные к выгрузке**

    Эта команда подгоняет склеенный набор данных под формат сайта <https://how-old-is-this.house>.

    ```sh
    ## 🚧 Эта команда пока что не реализована
    yarn exe src/commands/5-prepareUpload.ts
    ```

### Просмотр черновика постера

Результат склейки слоёв доступен в виде веб-страницы.
Чтобы её открыть, надо запустить локальный веб-сервер, будучи в папке `/path/to/tooling`:

```sh
yarn dev
```

Эта команда остаётся запущенной в терминале до нажатия `ctrl+c`.
Пока веб-сервер работает, черновик постера доступен в браузере по адресу [localhost:3000/poster](http://localhost:3000/poster).

Чтобы сгенерировать изображение с постером, надо открыть второй терминал, перейти в папку `/path/to/tooling` и запустить команду:

```sh
yarn exe src/commands/9-makePoster.ts
```

Для успешной генерации файла, важно, чтобы в первом терминале команда `yarn dev` продолжала быть запущенной.
Путь к черновику постера будет написан в выводе команды.

> 🚧 Настройка размеров и других параметров постера пока не реализована.
> По задумке это будет делаться в `territory-config.yml` → `poster`.
>
> Цвета домиков можно попробовать настроить в файле `/path/to/tooling/src/shared/completionDates.ts`.
> Веб-страница автоматически обновляется при его сохранении.
> После изменений в данных страницу надо обновить вручную.

### Корректировка результата

Запуск команд не требует ручных шагов по обработке данных.
Как следствие, ошибки в источниках неизбежно попадают в итоговый файл.

Чтобы повысить качество и полноту результата, предусмотрена возможность подмешивать данные, созданные вручную.
Это позволяет добавлять на карту особые объекты (например, мосты) или исправлять ошибки в характеристиках (например, корректировать год постройки).

Как и файлы `/path/to/data/territories/TERRITORY_NAME/sources/*/output-layer.geojson`, ручные слои — это файлы `*.geojson`.
Их помещают в папку `/path/to/data/territories/TERRITORY_NAME/sources/manual`.
Название файла может быть любым (например, `bridges.geojson`), а число таких файлов неограниченно.
Структура содержимого — такая же, как у файлов `output-layer.geojson`.

Данные из папки `manual` имеют приоритет над остальными источниками.
Важно не забыть указать `"layerRole": "base"` или `"layerRole": "patch"`, иначе ваш файл `*.geojson` будет проигнорирован.

При ручном создании объекта-заплатки есть специальная возможность перечислить данные, которые следует проигнорировать при склейке.
Например, в слое Минкульта может быть снесённый дом, на месте которого построен новый, с уже правильными данными в Росреестре.
Чтобы исключить данные по снесённому дому из склейки, мы создаём файл `/path/to/data/territories/TERRITORY_NAME/sources/manual/patches.geojson` (`"layerRole": "patch"`).
В него добавляем точку с координатами внутри контура проблемного дома:

```json
{
  "type": "FeatureCollection",
  "layerRole": "patch",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [12.345678, 12.345678]
      },
      "properties": {
        "dataToIgnore": "mkrf",
        "description": "ул. Тестовая 42 отмечен как памятник, а это уже небоскрёб"
      }
    }
  ]
}
```

Благодаря `"dataToIgnore": "mkrf"`, характеристики здания по версии Минкульта будут исключены из финального набора данных.
Чтобы исправить другие случае неправильной склейки, можно добавить больше объектов `Feature` в этот же файл.

Кроме названия игнорируемого источника, можно указывать идентификатор объекта и конкретной характеристики через разделитель `|`.
Также разрешается перечислять несколько правил через запятую:

```json
"dataToIgnore": "mkrf"
"dataToIgnore": "mkrf|id12345"
"dataToIgnore": "mkrf|id12345|completionDates"
"dataToIgnore": "mkrf|*|completionDates"
"dataToIgnore": "mkrf|id12345,mingkh|*|completionDates"
```

> 🚧 Команда выбора финальных характеристик пока что не умеет работать с полем `dataToIgnore`.
> Тем не менее, его уже рекомендуется заполнять в качестве задела на будущее.

После обновления файлов `/path/to/data/territories/TERRITORY_NAME/sources/manual/*.geojson`, следует повторить шаг «Склеить слои».

Важно не заниматься ручным редактированием файлов во всех папках `/path/to/data/territories/TERRITORY_NAME/sources/*`, кроме `manual`.
Исправления, сделанные в других подпапках, сотрутся при обновлении данных.

Неточности в ОСМ проще всего исправлять на сайте [osm.org](https://www.openstreetmap.org), а потом заново скачивать улучшенные данные.
Инструкции для участия в проекте вы найдёте на [wiki.osm.org](https://wiki.openstreetmap.org/wiki/RU:Заглавная_страница).
При добавлении любых данных в базу ОСМ важно пользоваться только разрешёнными источниками.
Копировать содержимое других карт запрещено — сомнительные правки будут удалены участниками сообщества. [См. FAQ](https://wiki.openstreetmap.org/wiki/RU:FAQ).

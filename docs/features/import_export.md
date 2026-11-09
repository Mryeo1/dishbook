本应用提供用途广泛的导入与导出功能，旨在尽可能带来最佳体验，
并让你自由选择数据的去向。

!!! WARNING "开发中"
    该模块相对较新。在大型导出时存在已知的 [超时](https://github.com/vabene1111/recipes/issues/417) 问题。
    修复正在开发中，预计将在下一个版本发布。

该模块以最大程度的灵活性和可扩展性为设计目标，可轻松添加新的集成，
让你能够按任意所需的格式导入和导出菜谱。

觉得缺少某个重要的集成？只需查看 [集成相关问题](https://github.com/Mryeo1/dishbook/issues?q=is%3Aissue+is%3Aopen+label%3Aintegration)，或者
在你喜欢的集成缺失时新开一个 issue。

!!! info "导出"
    我坚信每个人都有权按自己的意愿使用自己的数据，因此希望为你的菜谱
    提供尽可能最佳的灵活性。
    话虽如此，对大多数人而言，让本应用运行起来并导入自己的菜谱才是最重要的。
    因此，导入尽可能多的格式优先于导出。
    针对不同格式的导出器将随时间陆续推出。

各集成能力概览。

| 集成               | 导入   | 导出   | 图片   |
| ------------------ |--------| ------ | ------ |
| Default            | ✔️     | ✔️     | ✔️     |
| Nextcloud          | ✔️     | ⌚     | ✔️     |
| Mealie             | ✔️     | ⌚     | ✔️     |
| Chowdown           | ✔️     | ⌚     | ✔️     |
| Safron             | ✔️     | ✔️     | ❌     |
| Paprika            | ✔️     | ⌚     | ✔️     |
| ChefTap            | ✔️     | ❌     | ❌     |
| Pepperplate        | ✔️     | ⌚     | ❌     |
| RecipeSage         | ✔️     | ✔️     | ✔️     |
| Rezeptsuite.de     | ✔️     | ❌     | ✔️     |
| Domestica          | ✔️     | ⌚     | ✔️     |
| MealMaster         | ✔️     | ❌     | ❌     |
| RezKonv            | ✔️     | ❌     | ❌     |
| OpenEats           | ✔️     | ❌     | ⌚     |
| Plantoeat          | ✔️     | ❌     | ✔      |
| CookBook Manager   | ✔️     | ⌚     | ✔️     |
| Cooklang           | ✔️    | ⌚    | ⌚    |
| CopyMeThat         | ✔️     | ❌     | ✔️     |
| Mela               | ✔️     | ⌚     | ✔️     |
| Cookmate           | ✔️     | ⌚     | ✔️     |
| PDF (experimental) | ⌚️     | ✔️     | ✔️     |
| Gourmet            | ✔️     | ❌     | ✔️     |
| Pestle             | ✔️     | ❌     | ✔️     |


✔️ = 已实现，❌ = 未实现且不可能/未计划，⌚ = 尚未实现

## Default

Default 集成是内置的（也是首选的）菜谱导入与导出方式。
它随新字段的加入而持续维护，包含将菜谱从一套安装迁移到另一套安装所需的全部数据。

它也是少数真正在结构上便于机器读取的菜谱格式之一，方便你将数据用于任何其他用途。

!!! info "导入格式"

    使用 Default 集成时，导入要求提供由 Tandoor 生成的导出归档（`.zip`）。

    仅导入解压后的 `.json` 文件不受支持，可能导致导入错误。

    要在不同的 Tandoor 实例之间迁移菜谱，请直接使用导出的 ZIP 归档，无需解压其内容。

## RecipeSage

进入「设置 > 导出菜谱数据」并选择 `EXPORT AS JSON-LD (BEST)`。然后只需将导出的文件
上传到 Tandoor。

RecipeSage 集成也支持导出。要从 Tandoor 迁移到 RecipeSage，只需选择 RecipeSage
进行导出，然后在 RecipeSage 中导入该 json 文件。目前导出尚不支持图片。

## Domestica

进入「导入/导出」并选择 `Export Recipes`。然后只需将导出的文件
上传到 Tandoor。

## Nextcloud

从 Nextcloud Cookbook 导入菜谱非常简单，而且由于 Nextcloud Cookbook 提供了良好、标准化且
结构化的信息，你的大部分菜谱内容都会保持完整。

按以下步骤导入你的菜谱

1. 打开你的 Nextcloud 网页界面
2. 找到 `Recipes` 文件夹（通常位于你账户的根目录下）
3. 下载该文件夹，得到 `Recipes.zip`，其中包含 `Recipes` 文件夹，里面每个菜谱对应一个文件夹
4. 将 `Recipes.zip` 上传到 Tandoor 并导入


!!! WARNING "文件夹结构"
    只有在文件夹结构正确时导入才能正常工作。如果你没有使用标准路径，或以任何其他方式
    创建 zip 文件，请确保结构如下
    `  Recipes.zip/
        └── Recipes/
            ├── Recipe1/
            │   ├── recipe.json
            │   └── full.jpg
            └── Recipe2/
                ├── recipe.json
                └── full.jpg
    `

## Mealie

Mealie 提供与 Nextcloud 类似的结构化数据。

!!! WARNING "版本"
     Mealie 导入器有两个不同版本：一个用于 1.0 版本之前创建的所有备份，另一个用于 1.0 版本及之后创建的所有备份。 

!!! INFO "版本"
    Mealie 的界面不会标明营养信息是按每份还是按每个菜谱存储。这一选择留给用户。导入过程中，你需要选择 
    Tandoor 应如何处理你的营养数据。

迁移你的菜谱

1. 进入你的 Mealie 管理设置并创建新备份（注意，仅从 Mealie 的数据管理部分导出菜谱数据会导致导入不完整）。
2. 下载该备份。
3. 将整个 `.zip` 文件上传到导入页面并导入全部内容。

## Chowdown

Chowdown 将所有菜谱以纯文本 markdown 文件的形式存储在一个名为 `_recipes` 的目录中。
图片保存在名为 `images` 的目录中。

要导入你的 Chowdown 菜谱，只需将这两个文件夹打包成一个 `.zip` 文件并导入。
文件夹结构应如下所示：

!!! info "_recipes"
    出于某种原因，chowdown 在 `recipes` 文件夹前使用了 `_`。为避免混淆，导入同时支持 `\_recipes` 和 `recipes`。

```
Recipes.zip/
    ├── _recipes/
    │   ├── recipe one.md
    │   ├── recipe two.md
    │   └── ...
    └── images/
        ├── image-name.jpg
        ├── second-image-name.jpg
        └── ...
```

## Safron

进入你的 Safron 设置页面并导出菜谱。
然后只需将整个 `.zip` 文件上传到导入器。

!!! warning "图片"
    Safron 导出不包含任何图片。导入过程中它们会丢失。

## Paprika

Paprika 导出包含一个装有菜谱 html 表示的文件夹以及一个 `.paprikarecipes` 文件。

`.paprikarecipes` 文件基本上就是一个包含 gzip 压缩内容的 zip。只需上传整个文件并导入
你的全部菜谱。

## Pepperplate

Pepperplate 提供一个 `.zip` 文件，其中包含你所有的菜谱，格式为 `.txt` 文件。这些文件结构良好，可以
完整导入所有数据而不丢失任何内容。

只需从 Pepperplate 导出菜谱并将 zip 上传到 Tandoor。导出不包含图片，因此
无法导入图片。

## ChefTap

ChefTap 允许你从应用中导出菜谱（我想是这样）。导出的是一个 zip 文件，其中包含名为
`cheftap_export` 的文件夹，里面是包含你菜谱的 `.txt` 文件。

该格式基本上完全无结构，每次导出看起来都不一样。这使得导入非常困难，
并导致效果不佳。图片也不受支持，因为导出中不包含图片（至少
我测试时如此）。

通常导入应能识别所有食材，并把其余内容放入步骤中。如果你的导入失败
或效果比这更差，欢迎提供更多示例数据，我可以尝试改进导入器。

由于 ChefTap 本身也无法导入这些文件，Tandoor 不会实现导出器。

## MealMaster

MealMaster 可通过上传一个或多个 MealMaster 文件来导入。
文件应为 `.txt`、`.MMF` 或 `.MM` 格式。

MealMaster 规范允许许多变体。目前仅支持单列格式的食材。
食材的第二行注释目前也不会作为注释导入，而是直接放入步骤中。
如果你有无法导入的 MealMaster 菜谱，欢迎提交 issue。

## RezKonv

RezKonv 格式主要用于德语菜谱管理器 RezKonv Suite。
要从 RezKonv Suite 迁移到 Tandoor，请选择 `Export > Gesamtes Kochbuch exportieren`（导出菜单中的最后一项）。
生成的文件可直接导入 Tandoor。

由于我只有有限的示例数据，如果你的 RezKonv 导出无法导入，欢迎提交 issue。

## Recipe Keeper

Recipe Keeper 允许你通过其应用导出包含菜谱和图片的 zip 文件。
该 zip 文件可直接导入 Tandoor。

## OpenEats

OpenEats 未提供通过界面导出数据的任何方式。幸运的是，从命令行导出相对容易。
你需要在应用 API 容器内运行命令 `python manage.py dumpdata recipe ingredient`。
如果你遵循默认安装方式，可以使用以下命令 `docker-compose -f docker-prod.yml run --rm --entrypoint 'sh' api ./manage.py dumpdata recipe ingredient`。
该命令可能也可行 `docker exec -it openeats_api_1 ./manage.py dumpdata recipe ingredient rating recipe_groups > recipe_ingredients.json`

将输出的 json 字符串保存到 `.json` 文件中，然后使用导入器导入。文件应大致如下所示：

```json
[
   {
      "model":"recipe.recipe",
      "pk":1,
      "fields":{
         "title":"Tasty Chili",
         ...
      }
   },
  ...
    {
      "model":"ingredient.ingredientgroup",
      "pk":1,
      "fields":{
         "title":"Veges",
         "recipe":1
      }
   },
  ...
  {
      "model":"ingredient.ingredient",
      "pk":1,
      "fields":{
         "title":"black pepper",
         "numerator":1.0,
         "denominator":1.0,
         "measurement":"dash",
         "ingredient_group":1
      }
   }
]

```

要导入图片，你需要在 Tandoor 的 `recipes` 媒体文件夹（通常位于 `/opt/recipes/mediafiles`）中创建 `openeats-import` 文件夹。之后需要将 OpenEats API Docker 容器中的 `/code/site-media/upload` 文件夹复制到你创建的 `openeats` 文件夹中。此时你在 Tandoor 中应得到文件路径 `/opt/recipes/mediafiles/recipes/openeats-import/upload/...`。

## Plan to Eat

Plan to Eat 允许你导出包含全部菜谱的文本文件。只需将该文本文件上传到 Tandoor 即可导入所有菜谱

## CookBook Manager

CookBook Manager（原名 CookBookApp）可以导出包含 YAML 文件的 .zip 文件。 
在「设置 -> 备份」中导出时选择 YAML 选项。将整个 ZIP 上传到 Tandoor 即可导入其中包含的所有菜谱。

## CopyMeThat

CopyMeThat 可以导出 `.zip` 文件，其中包含一个 `.html` 文件以及一个包含所有图片的文件夹。将整个 `.zip` 文件上传到 Tandoor 即可导入其中包含的所有菜谱。

## Cookmate

Cookmate 允许导出 `.mcb` 文件，你可以直接将其上传到 Tandoor 并导入所有菜谱。

## Cooklang
Cooklang 允许你将 `.cook` 文件导入 Tandoor。尚不支持附加图片或导入 zip 文件。

## RecetteTek

RecetteTek 导出的是 `.rtk` 文件，可直接上传到 Tandoor 以导入所有菜谱。

## Rezeptsuite.de

Rezeptsuite.de 导出的是 `.xml` 文件，可直接上传到 Tandoor 以导入所有菜谱。

看起来 Rezeptsuite.de 可能根据客户端不同而导出包含 `.cml` 文件的 `.zip` 文件。
如果出现这种情况，只需解压该 `.zip` 文件并将 `.cml` 改为 `.xml` 即可导入你的菜谱。

## Mela

Mela 提供多种导出格式，但只有 `MelaRecipes` 格式能导出完整集合。
执行该导出，并使用你常用的压缩包打开程序（例如 7-Zip）打开 `.melarecipes` 文件。
如果该文件中还包含另一个 `.melarecipes` 文件，请重复此操作，直到得到包含一个或多个 `.melarecipe` 文件的列表。
将所有你想导入的 `.melarecipe` 文件上传到 Tandoor 并开始导入。

## PDF

基于 pyppeteer 的 PDF 导出已被移除。要将菜谱保存为 PDF，请使用浏览器内置的打印功能（Ctrl+P / Cmd+P）。

<!--
PDF 导出器是一项实验性功能，使用 Puppeteer 浏览器渲染器渲染每个菜谱并导出为 PDF。
为此，它会向你的服务器下载约 140 MB 的 Chromium 二进制文件，然后用它渲染 PDF 文件。

由于某些服务器管理员可能不希望这样，PDF 导出器默认禁用，可通过 `.env` 中的 `ENABLE_PDF_EXPORT=1` 启用。

有关此事的更多讨论请参见 [这个 issue](https://github.com/TandoorRecipes/recipes/pull/1211)，
有关支持服务端渲染的未来计划请参见 [这个 issue](https://github.com/TandoorRecipes/recipes/issues/781)。
-->

## Gourmet

用于导入来自 [Gourmet](https://github.com/thinkle/gourmet/) 的文件。由于 `.grmt` 文件似乎缺少食材的单位，
需要使用包含 `.htm` 和 `.jpg` 的 `.zip` 文件。

要生成该文件，请在 Gourmet 中导出为 HTML，并将生成的文件夹打包为 zip。

不支持导入菜单。

由于 `.grmt` 格式存在问题，不支持导出。

## Pestle 

用于导入你的 [Pestle](https://pestlechef.app/) 菜谱集合。要使用它，请进入 Pestle 应用中的设置，点击「导出」并选择「Pestle Recipe Format」。你将得到一个名为 `mm-dd-yyyy.pestle` 的文件，可用于导入。

导入时若可用，将导入以下信息：名称、描述、份数、等待时间、工作时间、分类（关键词）、关键词、食材（作为额外步骤）、步骤、营养信息、图片和来源。

> [!WARNING]
> 其他字段如：评分、作者、备注、菜系或视频将会丢失。

不支持导出，因为 Pestle 需要图片 URL，而导入中不包含这些 URL。

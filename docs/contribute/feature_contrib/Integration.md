# 导入 / 导出集成贡献指南

# 准备工作
要创建新的集成，你需要配置 5 个文件
1. 在 `/cookbook/integration/` 中创建新的集成类
2. 在 `/cookbook/forms.py` 中包含该集成
3. 在 `/cookbook/views/import_export.py` 中添加新集成类的导入，并将其加入 'if' 链中
4. 将你的集成添加到 `/docs/features/import_export.md` 的文档中
5. 在 `/vue3/src/utils/integration_utils.ts` 中包含该集成及文档链接


## 1. 创建新的集成类
你的集成类应以其对接的对象命名，并应继承 `Integration` 类。使用下面的模板来搭建你的类。

`/cookbook/integration/yourintegration.py`
```python
from io import BytesIO, StringIO
from zipfile import ZipFile

from cookbook.integration.integration import Integration
# from cookbook.helper.ingredient_parser import IngredientParser
# import other cookbook.helper as necessary
from cookbook.models import  Ingredient, Keyword, NutritionInformation, Recipe, Step


class YourIntegrationName(Integration):
    
    def get_recipe_from_file(self, file) -> Recipe:
        #Import Recipe Logic - convert information from file into Recipe() object
        pass
    
    def import_file_name_filter(self, file) -> bool:
        #check file extension, return True if extension is correct
        pass
    
    def get_file_from_recipe(self, recipe) -> tuple[str,str]:
        #Export Recipe Logic - convert from Recipe() object to a writable string in your integration's format
        # return 'Filename.extension', 'file string'
        pass
        
    def get_files_from_recipes(self, recipes, el, cookie) -> list[list[str,bytes]]:
        # 'el' and 'cookie' are passed through by the calling function 'do_export'
        export_zip_stream = BytesIO()
        export_zip_obj = ZipFile(export_zip_stream, 'w')

        for recipe in recipes:
            if True: #add any verification logic
                # get string data and filename from get_file_from_recipe() method and save it to a zip stream
                recipe_stream = StringIO()
                filename, data = self.get_file_from_recipe(recipe)
                recipe_stream.write(data)
                export_zip_obj.writestr(f'{recipe.name}/{filename}', recipe_stream.getvalue())
                recipe_stream.close()

            el.exported_recipes += 1
            el.msg += self.get_recipe_processed_msg(recipe)
            el.save()

        export_zip_obj.close()
        
        # returns a [[file name, zip stream data]]
        # self.get_export_file_name is an inherited from the Integration class and doesn't require definition
        return [[self.get_export_file_name(), export_zip_stream.getvalue()]]
    
```

## 2. 在 Forms.py 中包含
在 `/cookbook/forms.py` 中找到 `ImportExportBase` 类，并在其中与其他项一起添加以下内容：
```python
YOURINTEGRATION = "YOURINTEGRATION"
```
然后你会在其下找到以下声明：

`
type = forms.ChoiceField(choices=())
`
这些选项将包含一长串元组。向元组列表中添加以下内容：

```python
(YOURINTEGRATION, 'Your Integration'),
```

## 3. 在视图中包含
在 `/cookbook/views/import_export.py` 中导入你的集成

```python
from cookbook.integration.yourintegration import YourIntegration
```

然后将以下代码添加到长长的 `if` 链中：

```python
if export_type == ImportExportBase.YOURINTEGRATION:
    return YourIntegration(request, export_type)
```

注意使用你在 `cookbook/forms.py` 中使用的全大写准确集成名称，否则它不会将其识别为某种类型。snake case 指的是你在 `/cookbook/integration` 中定义的类

## 4. 添加到文档
至少你必须在 `/docs/features/import_export.md` 中添加一段关于你集成的简短说明，因为 Vue 页面需要在用户点击导入/导出表单上的信息按钮时提供跳转链接。

转到文档底部并添加：
```markdown
## YourIntegration
a little blurb about how it works or anything users should know about how the data needs to be formated.
```

此外，将你的集成添加到文档顶部的表格中，标注集成的状态，或者等到它完成集成和测试后再添加到表格。

## 5. 添加到 Vue 集成工具
在 `/vue3/src/utils/integration_utils.ts` 中找到 `export const INTEGRATIONS: Array<Integration>`，并在长列表中添加：
```typo3_typoscript
{id: 'YOURINTEGRATION', name: "Your Integration", import: true, export: false, helpUrl: 'https://docs.tandoor.dev/features/import_export/#yourintegration'},
```
确保将导入和导出选项的 'true' 或 'false' 值改为适合你集成的正确值。'true' 表示它应分别列在导入或导出的菜单中。

### 之后务必使用 `yarn` 更新 Vue，以确保 HTML 文件得到更新

---

# 集成测试准备
## 文件结构与文件
Tandoor 使用 Pytest 实现其测试功能。要添加测试和测试文档，请导航到
```
cookbook/tests/other/
``` 
在那里你可以创建测试文件 `test_yourintegration.py`。文件名以 "test_" 开头非常重要，因为 pytest 就是据此判断将其作为测试运行的。

对于你希望为集成解析和测试的文本文件，可以将它们放在：

```
cookbook/test/other/test_data/your_integration/
```
并在其中为测试输入创建自己的文件夹。当让测试从该文件夹拉取文件时，请确保包含从 `cookbook/` 开始的完整路径

## 使用 Request 对象创建集成测试
与文件名类似，pytest 在文件 `test_yourintegration.py` 中会专门查找以字符串 `test_` 开头的函数，任何没有该前缀的函数都不会被运行。如果你想为测试定义辅助方法，这会很有用。

由于你的集成是 `Integration` 类的子类，你必须向集成传递必需的参数：`request` 和 `export_type`。除非你的测试要测试特定的 export_type，否则 `export_type` 填什么并不重要，只要是字符串即可。我在测试中通常只用 "export"。但对于 request，我们需要生成一个

你可以使用以下代码完成：
```python
from io import BytesIO

from django.contrib import auth
from django.test import RequestFactory
from django_scopes import scope

from cookbook.integration.cooklang import YourIntegrationClass

def test_yourintegration(u1_s1):
    user = auth.get_user(u1_s1)
    space = user.userspace_set.first().space
    request = RequestFactory()
    request.user = user
    request.space = space
    
    with scope(space=space):
        integration_object = YourIntegrationClass(request, "export")
        with open("cookbook/test/other/test_data/your_integration/recipe_file.txt", "rb") as file:
            recipe_bytes = file.read()
            recipe_name = file.name
        buffer = BytesIO(recipe_bytes)
        buffer.name = recipe_name
        recipe_object = integration_object.get_recipe_from_file(buffer)
        # all of your test function logic inside this with clause 
```
虽然你无需理解它，但 u1_s1 是可以传入测试的 pytest fixture。将其作为测试的参数后，pytest 会填充该 fixture，你就可以通过 `auth.get_user()` 方法用它获取测试用户

有了这些，你就可以添加断言并使用 pytest 进行测试。

---
# 集成类逻辑
现在准备工作已完成，你需要为你创建的新集成类实现逻辑。

## get_recipe_from_file 方法
当通过 Web 门户导入文件时，`Integration.do_import()` 类方法会调用此函数。`get_recipe_from_file(self, file)` 只接受一个文件作为参数，该参数由 `Integration.do_import()` 传入，是一个 `IOByte` 二进制对象，仅包含文件内容的二进制字符，以及一个名为 `name` 的属性，其值为文件名的 "utf-8" 字符串

### 读取文件
要获取文件内容的字符串值，你必须调用以下方法：

```python
file_text = file.getvalue().decode("utf-8")
```
然后你可以按适合你集成的方式解析 file_text。无需编写 `with open()` 语句。`Integration` 父类负责文件的打开与关闭。

如果你的菜谱名称依赖于文件名，可以通过以下方式访问文件名：
```python
filename = file.name
```

### 管理 Tandoor 的「Recipe」对象
`Recipe` 类有很多属性，建议[在此处](https://github.com/TandoorRecipes/recipes/blob/develop/cookbook/models.py)查看全部属性，以便确定你的集成将如何把数据组织进 `Recipe` 对象的数据结构。需要了解的重要属性有：
```python
name = models.CharField(max_length=128)
description = models.CharField(max_length=512, blank=True, null=True)
servings = models.IntegerField(default=1)
servings_text = models.CharField(default='', blank=True, max_length=32)
image = models.ImageField(upload_to='recipes/', blank=True, null=True)
keywords = models.ManyToManyField(Keyword, blank=True)
steps = models.ManyToManyField(Step, blank=True)
internal = models.BooleanField(default=False)

created_by = models.ForeignKey(User, on_delete=models.PROTECT)

space = models.ForeignKey(Space, on_delete=models.CASCADE)
```
你可以在创建 Recipe 对象时定义任意多个这些变量，但最低限度应该是：

```python
from cookbook.models import Recipe

def get_recipe_from_file(self, file)-> Recipe:
    #opening the file and parsing it
    
    recipe_object = Recipe.objects.create(
        name = your_recipe_name,
        created_by = self.request.user,
        internal = True,
        space = self.request.space,
    )
    
    #translating the parsed file into th recipe object
    
    return recipe_object
```
`created_by` 和 `space` 都需要来自发起请求的网页或 API 的 request 对象，`Integration` 父类会处理这两者，它们可以通过 `self.request` 属性获取。`name` 使菜谱可与其他菜谱区分开来，使其区别于其他新实例化的 `Recipe` 对象。最后，`True` 是 `internal` 的默认值，只有在你确实想这么做时才将其改为 false。

`Recipe` 对象创建后，你可以修改或向其属性添加数据，这些更改会在测试中体现并按预期工作，直到程序将其从内存中释放。除非你使用 `.save()` 方法，否则所有这些更改都会丢失。建议不要每次更改后都调用 `.save()`，而是在 `get_recipe_from_file` 方法末尾、对象返回给 `Integration.do_import()` 方法之前，统一调用一次 `.save()`。

```python
from cookbook.models import Recipe

def get_recipe_from_file(self, file)-> Recipe:
    #opening the file and parsing it
    
    recipe_object = Recipe.objects.create(
        name = your_recipe_name,
        created_by = self.request.user,
        internal = True,
        space = self.request.space,
    )
    
    # Integration logic, making many changes to the recipe_object
    
    recipe_object.description = "A yummy treat for any day!"
    recipe_object.save()
    return recipe_object
```

### 其他需要了解的模型
除 `Recipe` 外，你需要使用的 3 个主要模型是 `Step`、`Ingredient`（还有 `Food` 和 `Unit`——它们总是配套使用）以及 `Keyword`。这些对象在 `Recipe` 中的大致结构为：

（注意 `Recipe` 对象不是 `Json` 对象，下面只是数据的表示）
```json
{Recipe: 
    [{"steps": 
        [{Step: [
            {"ingredients": [
                {Ingredient: 
                  {"food": 
                    {Food:
                      [{"name": "food name"},
                        {Unit: {"name": "unit name"}},
                        {"amount": int}
                    ]}}}]},
            {"instruction": "recipe step text"}
        ]}]},
    {"keywords": [
        {Keyword: 
          {"name": "keyword name"}
        }]}]}
```
下面是它们在创建 `Recipe` 对象集成方面的最简实现。

```python
from cookbook.models import Recipe, Keyword, Step, Ingredient, Food, Unit

def get_recipe_from_file(self, file)-> Recipe:
    #opening the file and parsing it
    
    recipe_object = Recipe.objects.create(
        name = your_recipe_name,
        created_by = self.request.user,
        internal = True,
        space = self.request.space,)
    
    #logic for creating a list of keywords

    for keyword in parsed_file.keywords:
        recipe_object.keywords.add(
            Keyword.objects.get_or_create(
                space=self.request.space, 
                name=keyword)[0])
    
    i = 0
    for line in parsed_file:
        #logic for creating a list of ingredients
        #logic for instructions
        step = Step.objects.create(
            instruction=line.instruction_string, 
            order=i, 
            space=self.request.space, 
            show_ingredients_table=self.request.user.userpreference.show_step_ingredients)
        for ingredient in line.ingredients:
            step.ingredients.add(
                Ingredient.objects.create(
                    food=Food.objects.get_or_create(name=ingredient.name, space=self.request.space)[0],
                    unit=Unit.objects.get_or_create(name=ingredient.quantity.unit, space=self.request.space)[0],
                    amount=ingredient.quantity.amount,
                    space=self.request.space, ))
        recipe_object.steps.add(step)
        i+=1
    recipe_object.save()
    return recipe_object
```

## import_file_name_filter 方法
文档待补充。

## get_file_from_recipe 方法
文档待补充。

## get_files_from_recipes 方法
文档待补充。


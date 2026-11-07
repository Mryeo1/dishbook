"""Attach a photo to every demo recipe.

Photos come from TheMealDB (free, no key), picked to be visually close to the
dish rather than exact - they are here so the UI can be judged with real
pictures in place.

Run with:  .venv/Scripts/python.exe scripts/seed_demo_images.py
"""

import io
import os
import sys
import time
import urllib.request

import django

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'recipes.settings')
django.setup()

from django.core.files.base import ContentFile  # noqa: E402
from django_scopes import scopes_disabled  # noqa: E402
from PIL import Image  # noqa: E402

from cookbook.models import Recipe, Space  # noqa: E402

SPACE_NAME = '陈晓的厨房'
THUMB = 'https://www.themealdb.com/images/media/meals/{}'
UA = 'Mozilla/5.0 (compatible; TandoorDemoSeed/1.0)'

# recipe name -> TheMealDB image file
IMAGES = {
    '番茄炒蛋': 'rwvw8q1765660071.jpg',          # Chinese tomato & egg stir fry
    '凉拌黄瓜': '93iok31766436070.jpg',          # sesame cucumber salad
    '蒜蓉西兰花': 'm0p0j81765568742.jpg',        # broccoli stir fry
    '青椒土豆丝': '1550441882.jpg',              # pan-fried potatoes
    '紫菜蛋花汤': '1529446137.jpg',              # egg drop soup
    '白灼生菜': 'i0610h1765659464.jpg',          # blanched greens
    '醋熘白菜': '9nh4dl1766435484.jpg',          # napa cabbage
    '香菇滑鸡饭': 'wuyd2h1765655837.jpg',        # chicken fried rice
    '手撕包菜': 'e2g2r21764367568.jpg',          # cabbage
    '蒜香烤面包片': '54xzk31760524666.jpg',      # flatbread slices
    '红烧肉': 't1hg8s1780087329.jpg',            # pork belly
    '可乐鸡翅': 'feh9k21784665694.jpg',          # chicken wings
    '鱼香肉丝': '1529443236.jpg',                # szechuan shredded beef
    '宫保鸡丁': '1525872624.jpg',                # kung pao chicken
    '清蒸鲈鱼': 'yx8j1i1763484612.jpg',          # steamed fish
    '土豆炖牛腩': 'k07k271782502861.jpg',        # beef stew
    '麻婆豆腐': '1525874812.jpg',                # ma po tofu
    '糖醋里脊': 'arzs741766434335.jpg',          # sweet & sour chicken
    '三鲜韭菜盒子': 'grhn401765687086.jpg',      # fried parcels
    '川味回锅肉': '1529442316.jpg',              # twice cooked pork
    '老北京炸酱面': '1529444830.jpg',            # lo mein noodles
    '广式煲仔饭': '5r5rvx1763287943.jpg',        # rice pot
    '手打牛肉丸汤粉': '6g9gif1782688663.jpg',    # noodle soup
    '淮扬狮子头': '72fgzj1764109947.jpg',        # meatballs
    '云南过桥米线': 'ikizdm1763760862.jpg',      # noodle soup
    '家常佛跳墙': '1529445893.jpg',              # rich soup
    '苏式鲜肉月饼': 'l6hj9a1784668199.jpg',      # small round buns
    '全麦乡村面包': 'lmc6r51764365554.jpg',      # rustic loaf
    '川味红油火锅底料': '1oz4nb1765687990.jpg',  # red oily sichuan dish
    '港式奶茶与菠萝油': 'as88dq1762772486.jpg',  # buns
}

MAX_WIDTH = 1000
QUALITY = 82


def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()


def shrink(raw: bytes) -> bytes:
    img = Image.open(io.BytesIO(raw)).convert('RGB')
    if img.width > MAX_WIDTH:
        img = img.resize((MAX_WIDTH, round(img.height * MAX_WIDTH / img.width)), Image.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, format='JPEG', quality=QUALITY, optimize=True)
    return buf.getvalue()


def run():
    with scopes_disabled():
        space = Space.objects.get(name=SPACE_NAME)
        recipes = {r.name: r for r in Recipe.objects.filter(space=space)}

        missing = [n for n in IMAGES if n not in recipes]
        if missing:
            print('recipes not found (skipped):', missing)

        done = 0
        for name, filename in IMAGES.items():
            recipe = recipes.get(name)
            if recipe is None:
                continue
            if recipe.image:
                print(f'  {name}: already has an image')
                continue
            try:
                raw = fetch(THUMB.format(filename))
                data = shrink(raw)
                recipe.image.save(f'recipe_{recipe.id}.jpg', ContentFile(data), save=True)
                print(f'  {name}: {len(data) // 1024} KB')
                done += 1
            except Exception as e:
                print(f'  {name}: FAILED {type(e).__name__} {e}')
            time.sleep(0.3)

        print(f'images attached: {done}, recipes with image: {Recipe.objects.filter(space=space).exclude(image="").count()}')


if __name__ == '__main__':
    run()

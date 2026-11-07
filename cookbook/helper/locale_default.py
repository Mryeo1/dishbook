"""
默认语言策略：没有明确选择时一律用站点默认语言（简体中文）。

Django 自带的 LocaleMiddleware 在用户没有选择过语言时会读浏览器的
Accept-Language 头，于是英文系统的浏览器（en-US,en;q=0.9）会拿到 en 的
页面，即使 settings.LANGUAGE_CODE 是 zh-hans。表现为同一个地址在 A 浏览器
是中文、在 B 浏览器是英文，或者第一次打开是英文、手动选择过之后才变中文。

本站以中文为默认，因此这里把探测顺序改成：
    1. 用户显式切换语言后写入的 django_language cookie
    2. set_language 视图写入的 session 语言
    3. settings.LANGUAGE_CODE
浏览器偏好不再参与决策，只有用户自己选过才算数。前端 i18n 读取模板上的
<html lang="...">，所以这里定下来的语言会一路传到界面文案。
"""

from django.conf import settings
from django.middleware.locale import LocaleMiddleware
from django.utils import translation
from django.utils.cache import patch_vary_headers

# Django 4.0 起移除了 LANGUAGE_SESSION_KEY 常量，set_language 用固定的 `_language`
_SESSION_KEY = "_language"


def _normalise(code: str | None) -> str | None:
    """把 zh-cn / zh / zh-hans 之类统一成 settings.LANGUAGES 里的代码。"""
    if not code:
        return None
    try:
        return translation.get_supported_language_variant(code)
    except (LookupError, ValueError):
        return None


class ChineseFirstLocaleMiddleware(LocaleMiddleware):
    """替换 LocaleMiddleware：忽略 Accept-Language，默认简体中文。"""

    def process_request(self, request):
        cookie_language = _normalise(request.COOKIES.get(settings.LANGUAGE_COOKIE_NAME))

        session_language = None
        if hasattr(request, "session"):
            session_language = _normalise(request.session.get(_SESSION_KEY))

        language = cookie_language or session_language or settings.LANGUAGE_CODE

        translation.activate(language)
        request.LANGUAGE_CODE = translation.get_language()

    def process_response(self, request, response):
        response.headers.setdefault("Content-Language", translation.get_language())
        # 内容不再随 Accept-Language 变化，缓存按 cookie 区分即可
        patch_vary_headers(response, ("Cookie",))
        return response

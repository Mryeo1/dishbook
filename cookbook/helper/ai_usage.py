"""
Credit / quota helpers for AI features.

These deliberately live outside ``ai_helper`` because that module imports
LiteLLM to subclass ``CustomLogger``.  LiteLLM takes several seconds to import
(and may try to download its model price map on first use), so anything that is
needed on the startup path - the serializers, the URLconf - must not touch it.
Everything in this module only depends on Django and the ORM.
"""
import re

from django.db.models import Sum
from django.utils import timezone

from cookbook.models import AiLog


def get_monthly_token_usage(space):
    """
    returns the number of credits the space has used in the current month
    """
    token_usage = AiLog.objects.filter(space=space, credits_from_balance=False, created_at__month=timezone.now().month).aggregate(Sum('credit_cost'))['credit_cost__sum']
    if token_usage is None:
        token_usage = 0
    return token_usage


def has_monthly_token(space):
    """
    checks if the monthly credit limit has been exceeded
    """
    return get_monthly_token_usage(space) < space.ai_credits_monthly


def can_perform_ai_request(space):
    return (has_monthly_token(space) or space.ai_credits_balance > 0) and space.ai_enabled


def strip_json_fences(text):
    """
    extracts the content of a Markdown code fence (```json ... ```) from an AI response.
    Some providers (e.g. Anthropic Claude via LiteLLM) wrap JSON in fences even when
    response_format json_object is requested, which breaks json.loads().
    The fenced block is also found if the model adds explanatory text before or after it.
    """
    stripped = text.strip()
    block = re.search(r'```[\w-]*[ \t]*\r?\n(.*?)\r?\n[ \t]*```', stripped, re.DOTALL)
    if block:
        return block.group(1).strip()
    match = re.fullmatch(r'```[\w-]*[ \t]*\n?(.*?)\n?[ \t]*(?:```)?', stripped, re.DOTALL)
    return match.group(1).strip() if stripped.startswith('```') and match else text

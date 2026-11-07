from decimal import Decimal

from litellm import CustomLogger

from cookbook.helper.ai_usage import (  # noqa: F401  (re-exported for backwards compatibility)
    can_perform_ai_request,
    get_monthly_token_usage,
    has_monthly_token,
    strip_json_fences,
)
from cookbook.models import AiLog


class AiCallbackHandler(CustomLogger):
    space = None
    user = None
    ai_provider = None
    function = None

    def __init__(self, space, user, ai_provider, function):
        super().__init__()
        self.space = space
        self.user = user
        self.ai_provider = ai_provider
        self.function = function

    def log_pre_api_call(self, model, messages, kwargs):
        pass

    def log_post_api_call(self, kwargs, response_obj, start_time, end_time):
        pass

    def log_success_event(self, kwargs, response_obj, start_time, end_time):
        self.create_ai_log(kwargs, response_obj, start_time, end_time)

    def log_failure_event(self, kwargs, response_obj, start_time, end_time):
        self.create_ai_log(kwargs, response_obj, start_time, end_time)

    def create_ai_log(self, kwargs, response_obj, start_time, end_time):
        credit_cost = 0
        credits_from_balance = False
        if self.ai_provider.log_credit_cost:
            credit_cost = kwargs.get("response_cost", 0) * 100

        if (not has_monthly_token(self.space)) and self.space.ai_credits_balance > 0:
            remaining_balance = self.space.ai_credits_balance - Decimal(str(credit_cost))
            if remaining_balance < 0:
                remaining_balance = 0

            self.space.ai_credits_balance = remaining_balance
            credits_from_balance = True
            self.space.save()

        AiLog.objects.create(
            created_by=self.user,
            space=self.space,
            ai_provider=self.ai_provider,
            start_time=start_time,
            end_time=end_time,
            input_tokens=response_obj['usage']['prompt_tokens'],
            output_tokens=response_obj['usage']['completion_tokens'],
            function=self.function,
            credit_cost=credit_cost,
            credits_from_balance=credits_from_balance,
        )

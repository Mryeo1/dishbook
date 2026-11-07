"""Absolute lifetime limit for a single sign-in.

``SESSION_COOKIE_AGE`` (with ``SESSION_SAVE_EVERY_REQUEST``) only ends *idle*
sessions: every request pushes the expiry back.  A browser tab that stays open
therefore keeps its session alive indefinitely.  ``SESSION_MAX_AGE`` adds a hard
cap on top of that:

* the tab is closed  -> no requests -> the idle window (5 minutes) ends the session
* the tab stays open -> the heartbeat keeps it alive, but only up to SESSION_MAX_AGE

The timestamp is written when the user logs in and removed together with the
session, so a fresh login always gets a fresh window.
"""

import time

from django.conf import settings
from django.contrib.auth import logout
from django.contrib.auth.signals import user_logged_in
from django.http import JsonResponse

SESSION_STARTED_KEY = 'auth_started_at'

API_PATH_PREFIXES = ('/api/', '/_allauth/')


def stamp_session_start(sender, request, user, **kwargs):
    """Remember when this sign-in started (used by the middleware below)."""
    if request is None:
        return
    request.session[SESSION_STARTED_KEY] = time.time()


def connect_session_signals():
    user_logged_in.connect(stamp_session_start, dispatch_uid='session-limits-stamp-start')


class SessionMaxAgeMiddleware:
    """Signs the user out once a single sign-in is older than SESSION_MAX_AGE."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if self._exceeded(request):
            logout(request)
            if request.path.startswith(API_PATH_PREFIXES):
                # the frontend watches for 401 and shows the timeout dialog
                return JsonResponse({'detail': 'session_max_age_exceeded'}, status=401)

        response = self.get_response(request)

        # tells the frontend exactly when the current sign-in ends, so the dialog
        # is shown on time without hard coding the limit on the client
        remaining = self._remaining(request)
        if remaining is not None:
            response['X-Session-Max-Age-Remaining'] = str(remaining)

        return response

    @staticmethod
    def _remaining(request):
        """seconds left until SESSION_MAX_AGE is reached, None when unknown"""
        limit = getattr(settings, 'SESSION_MAX_AGE', 0)
        started = request.session.get(SESSION_STARTED_KEY)
        if not limit or not started or not getattr(request.user, 'is_authenticated', False):
            return None
        return max(0, int(limit - (time.time() - float(started))))

    @staticmethod
    def _exceeded(request):
        limit = getattr(settings, 'SESSION_MAX_AGE', 0)
        if not limit:
            return False

        started = request.session.get(SESSION_STARTED_KEY)
        if not started:
            return False

        # a session without a user is already treated as anonymous elsewhere,
        # no need to touch it here
        if not getattr(request.user, 'is_authenticated', False):
            return False

        return time.time() - float(started) > limit

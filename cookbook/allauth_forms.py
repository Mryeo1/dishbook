from django import forms
from django.utils.translation import gettext_lazy as _


class TandoorSignupForm(forms.Form):
    """Extra fields collected during sign-up, plugged into allauth's signup form.

    allauth is configured to use the e-mail address as the only login identifier
    and derives the internal username from it, so the profile data a new user is
    asked for here is purely descriptive.
    """

    first_name = forms.CharField(
        label=_("First Name"),
        max_length=150,
        widget=forms.TextInput(attrs={"autocomplete": "given-name"}),
    )
    last_name = forms.CharField(
        label=_("Last Name"),
        max_length=150,
        widget=forms.TextInput(attrs={"autocomplete": "family-name"}),
    )

    def signup(self, request, user):
        # called by allauth right before the new account is persisted
        user.first_name = self.cleaned_data["first_name"].strip()
        user.last_name = self.cleaned_data["last_name"].strip()
        user.save(update_fields=["first_name", "last_name"])

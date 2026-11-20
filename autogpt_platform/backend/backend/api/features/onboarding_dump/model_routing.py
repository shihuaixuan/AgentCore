"""Resolve onboarding completions against the same transport as their client."""

import os

from backend.copilot.sdk.env import config

FAST_CLOUD_MODEL = "anthropic/claude-haiku-5.5"


def onboarding_model(setting: str, cloud_default: str = FAST_CLOUD_MODEL) -> str:
    return os.getenv(setting) or (
        config.fast_standard_model
        if config.transport.inherit_fast_model_for_aux
        else cloud_default
    )

from typing import Literal
from unittest.mock import AsyncMock, patch

import pytest

from backend.api.features.experts import experts_db


@pytest.mark.parametrize(
    "locale,about,expected",
    [
        ("zh-CN", None, "我是 Nova，是你创建的 AI 专家。我会按你的指示协助你完成工作。"),
        ("en", None, "I'm Nova, an AI Expert created by you. I use your instructions to help with your work."),
        ("zh-CN", "I edit Rust documentation.", "I edit Rust documentation."),
    ],
)
async def test_raised_identity_at_insert(
    locale: Literal["en", "zh-CN"], about: str | None, expected: str
):
    tx = AsyncMock()
    tx.expert.count.return_value = 0
    tx.expert.create.side_effect = RuntimeError("stop at insert")
    with patch.object(experts_db, "transaction") as transaction:
        transaction.return_value.__aenter__.return_value = tx
        with pytest.raises(RuntimeError, match="stop at insert"):
            await experts_db.create_raised_expert(
                "owner", "Nova", None, None, about=about, locale=locale
            )
    assert tx.expert.create.await_args.kwargs["data"]["identity"] == expected

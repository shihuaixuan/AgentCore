"""The managed Expert identity catalog.

One copy of ``avatar_catalog.json`` lives here and one beside the frontend's
``ExpertAvatar`` molecule; ``avatar_catalog_test.py`` keeps them identical and
checks every managed file exists. Every built-in Expert owns exactly one
professional portrait. The identity never changes with the Expert's name, role, skills,
category or the marketplace filter; category only picks the palette hex that
tints surfaces around the artwork.
"""

import re
from pathlib import Path
from typing import Literal

from pydantic import BaseModel

AvatarCategory = Literal[
    "marketing",
    "sales",
    "finance",
    "support",
    "operations",
    "research",
    "content",
    "development",
]

VisualCategory = Literal[
    "marketing",
    "sales",
    "finance",
    "support",
    "operations",
    "research",
    "content",
    "development",
    "general",
    "otto",
]


class PaletteEntry(BaseModel):
    label: str
    hex: str


class ManagedIdentity(BaseModel):
    id: str
    name: str
    job_title: str
    # Source roster categories, first one being the visual family.
    categories: list[str]
    visual_category: VisualCategory
    url: str


class AvatarCatalog(BaseModel):
    library: str
    palette: dict[VisualCategory, PaletteEntry]
    default_url: str
    identities: list[ManagedIdentity]
    legacy: dict[str, str]


CATALOG = AvatarCatalog.model_validate_json(
    Path(__file__).with_suffix(".json").read_text()
)
PALETTE = CATALOG.palette
IDENTITIES = {identity.id: identity for identity in CATALOG.identities}
IDENTITIES_BY_NAME = {identity.name: identity for identity in CATALOG.identities}
# The warm-stone General fallback: a custom Expert's appearance until it has a
# reviewed identity of its own, and where unknown legacy defaults land.
DEFAULT_AVATAR_URL = CATALOG.default_url
DEFAULT_RAISED_PORTRAIT_URL = DEFAULT_AVATAR_URL
MANAGED_AVATAR_URLS = frozenset(identity.url for identity in CATALOG.identities)


def resolve_avatar_url(url: str | None) -> str | None:
    """Map a stored default that no longer ships to the identity it stood for.

    Uploads, generated images and current managed URLs pass through unchanged.
    """
    if not url:
        return url
    path = re.split(r"[?#]", url, maxsplit=1)[0]
    key = re.sub(
        r"^(/autogpt-characters/v[\d.]+/[a-z0-9-]+/neutral)/[0-9]+\.(?:webp|png)$",
        r"\1/128.webp",
        path,
    )
    if key in CATALOG.legacy:
        return CATALOG.legacy[key]
    if path.startswith("/avatars/notion/") and path.endswith(".svg"):
        return DEFAULT_AVATAR_URL
    return url


def resolve_builtin_avatar_url(name: str, url: str | None) -> str | None:
    """A template's (or an unmodified hire's) default resolves by identity.

    Only URLs that were once this identity's default move; a custom upload or
    a generated image stays exactly as saved.
    """
    identity = IDENTITIES_BY_NAME.get(name)
    if identity and resolve_avatar_url(url) == identity.url:
        return identity.url
    return url


def visual_category_for(url: str | None) -> VisualCategory | None:
    """The palette family a managed identity belongs to, or None for anything
    that is not a managed identity."""
    resolved = resolve_avatar_url(url)
    for identity in CATALOG.identities:
        if identity.url == resolved:
            return identity.visual_category
    return None

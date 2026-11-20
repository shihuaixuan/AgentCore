import json
from pathlib import Path
from typing import get_args

from PIL import Image

from backend.api.features.experts.avatar_catalog import (
    CATALOG,
    DEFAULT_AVATAR_URL,
    IDENTITIES,
    PALETTE,
    VisualCategory,
    resolve_avatar_url,
    resolve_builtin_avatar_url,
    visual_category_for,
)

FOLDER = Path(__file__).parent
FRONTEND = FOLDER.parents[4] / "frontend"
PUBLIC = FRONTEND / "public"

# The design system's palette registry (expert-design-system, category rules).
DESIGN_SYSTEM_PALETTE = {
    "marketing": "#C47F5C",
    "sales": "#C9A35B",
    "finance": "#A5B09A",
    "support": "#CB9182",
    "operations": "#98AFC6",
    "research": "#AAA77A",
    "content": "#81AAA6",
    "development": "#777570",
    "general": "#B5ADA0",
    "otto": "#B6A4C8",
}
DESIGN_SYSTEM_ASSIGNMENT = {
    "marketing": {"Maria", "Jules", "Remy", "Maya", "Zara", "Marco", "Noor", "Clip"},
    "sales": {"Max", "Jordan", "Anika", "Omar"},
    "finance": {"Mina", "Theo", "Daniel"},
    "support": {"Riley", "Robin", "Sasha", "Kai"},
    "operations": {
        "Frankie",
        "Harper",
        "Vera",
        "Ellis",
        "Sofia",
        "James",
        "Ines",
        "Lena",
    },
    "research": {"Nadia", "Quinn", "Priya"},
    "development": {"Devon", "Alex", "Casey"},
    "content": set(),
    "general": {"General"},
    "otto": {"Otto"},
}


def test_existing_roster_avatar_maps_without_using_the_name():
    assert (
        resolve_avatar_url("/experts/maria.svg")
        == "/experts/professional/expert-maria.webp"
    )
    assert (
        resolve_avatar_url("/avatars/notion/7-11-10-7-7-0-43-0-0-0.rose.svg")
        == "/experts/professional/expert-remy.webp"
    )


def test_uploaded_generated_and_managed_avatars_are_preserved():
    for url in (
        "https://cdn.example/avatar.png",
        "/api/store/media/user/images/custom.png",
        "/avatars/mine.svg",
        "https://cdn.example/autogpt-characters/v1.1/expert-mina/neutral/128.webp?token=mine",
        "/autogpt-characters/v9.9/expert-jules/neutral/128.webp",
        IDENTITIES["expert-jules"].url,
        DEFAULT_AVATAR_URL,
    ):
        assert resolve_avatar_url(url) == url


def test_custom_legacy_avatar_gets_the_general_fallback_not_otto_or_a_face():
    assert resolve_avatar_url("/avatars/notion/1-2-3.violet.svg") == DEFAULT_AVATAR_URL
    assert DEFAULT_AVATAR_URL == "/experts/professional/expert-general-01.webp"
    assert resolve_avatar_url(None) is None


def test_retired_clay_defaults_resolve_to_the_identity_they_stood_for():
    assert (
        resolve_avatar_url("/experts/clay/v5/noor-marketing.png")
        == IDENTITIES["expert-noor"].url
    )
    assert (
        resolve_avatar_url("/experts/clay/v4/quinn-finance.png")
        == IDENTITIES["expert-quinn"].url
    )
    # The shared category sheets were never an identity, so a saved pick
    # becomes the General fallback rather than someone else's face.
    for category in ("content", "development", "finance", "operations", "research"):
        assert (
            resolve_avatar_url(f"/experts/clay/v1/{category}.png") == DEFAULT_AVATAR_URL
        )
    assert not any("/experts/clay/" in url for url in CATALOG.legacy.values())


def test_frontend_catalog_matches_backend_and_managed_files_exist():
    catalog = json.loads((FOLDER / "avatar_catalog.json").read_text())
    assert catalog == json.loads(
        (FRONTEND / "src/components/molecules/ExpertAvatar/catalog.json").read_text()
    )
    assert not list((PUBLIC / "autogpt-characters").glob("*/expert-*/**/*.*"))
    assert set(CATALOG.legacy.values()) <= {entry.url for entry in CATALOG.identities}
    for identity in CATALOG.identities:
        asset = "office-assistant" if identity.id == "otto" else identity.id
        assert identity.url == f"/experts/professional/{asset}.webp"
        with Image.open(PUBLIC / identity.url.lstrip("/")) as image:
            assert image.format == "WEBP"
            image.load()


def test_palette_and_assignments_follow_the_design_system():
    assert {k: v.hex for k, v in PALETTE.items()} == DESIGN_SYSTEM_PALETTE
    assert set(PALETTE) == set(get_args(VisualCategory))
    for category, names in DESIGN_SYSTEM_ASSIGNMENT.items():
        assert {
            i.name for i in CATALOG.identities if i.visual_category == category
        } == names
    assert len(CATALOG.identities) == 35
    assert len({i.url for i in CATALOG.identities}) == 35


def test_each_builtin_seeds_its_own_managed_identity(real_roster):
    by_name = {i.name: i for i in CATALOG.identities}
    for entry in real_roster:
        identity = by_name[entry["name"]]
        assert resolve_avatar_url(entry["avatar_url"]) == identity.url
        assert entry["categories"] == identity.categories
        assert entry["categories"][0] == identity.visual_category
        assert entry["job_title"] == identity.job_title
    assert len({entry["avatar_url"] for entry in real_roster}) == len(real_roster)


def test_identity_resolution_only_moves_a_templates_own_old_defaults():
    for identity in CATALOG.identities:
        for old, portrait in CATALOG.legacy.items():
            if portrait == identity.url:
                assert resolve_avatar_url(old) == portrait
                assert resolve_builtin_avatar_url(identity.name, old) == portrait
                if old.startswith("/autogpt-characters/"):
                    assert (
                        resolve_avatar_url(old.replace("128.webp", "40.png?v=2"))
                        == portrait
                    )
        for kept in (
            "https://cdn.test/custom.png",
            DEFAULT_AVATAR_URL,
            IDENTITIES["expert-mina"].url,
        ):
            if kept != identity.url:
                assert resolve_builtin_avatar_url(identity.name, kept) == kept
    # Name-aware resolution never guesses: an unknown name leaves the URL alone
    # (the URL-only legacy map is what moves it on the read path).
    assert (
        resolve_builtin_avatar_url("Unknown", "/experts/maria.svg")
        == "/experts/maria.svg"
    )


def test_visual_category_comes_from_the_identity_not_the_filter():
    assert visual_category_for(IDENTITIES["expert-maria"].url) == "marketing"
    assert visual_category_for("/experts/clay/v4/maria-content.png") == "marketing"
    assert visual_category_for("https://cdn.test/custom.png") is None
    assert visual_category_for(None) is None

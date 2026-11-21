"""Check builder display translations against this checkout's available blocks."""

import json
import re
import sys
from pathlib import Path


def main() -> int:
    frontend = Path(__file__).resolve().parents[2]
    sys.path.insert(0, str(frontend.parent / "backend"))
    from backend.blocks import load_all_blocks

    directory = frontend / "src/app/(platform)/build/helpers/copy"
    catalog = json.loads((directory / "blocks.zh-CN.json").read_text("utf-8"))
    available = load_all_blocks()
    issues: list[str] = []
    for block_id, block_class in available.items():
        block = block_class()
        entry = catalog.get(block_id)
        if not entry:
            issues.append(f"Missing: {block.name} ({block_id})")
        elif entry["type"] != block.name or entry["source"] != block.description:
            issues.append(f"Changed source: {block.name} ({block_id})")
    for block_id, entry in catalog.items():
        if not re.search(r"[\u3400-\u9fff]", entry["name"]) or (
            entry["source"] and not re.search(r"[\u3400-\u9fff]", entry["description"])
        ):
            issues.append(f"Missing Chinese display copy: {entry['type']} ({block_id})")
    for issue in issues:
        print(issue)
    print(f"{len(available)} registered blocks; {len(catalog)} translations; {len(issues)} issues")
    return int(bool(issues))


if __name__ == "__main__":
    raise SystemExit(main())

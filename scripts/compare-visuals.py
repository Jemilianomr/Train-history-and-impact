"""Compare captured pixels without editing images. Requires Pillow."""
from pathlib import Path
from datetime import datetime, timezone
from hashlib import sha256
import json
import sys

from PIL import Image, ImageChops, ImageStat

baseline = Path(sys.argv[1] if len(sys.argv) > 1 else "docs/audit/v2")
current = Path(sys.argv[2] if len(sys.argv) > 2 else "docs/audit/performance/visual")
rows = []
for path in sorted(current.glob("*.png")):
    original = baseline / path.name
    if not original.exists():
        raise SystemExit(f"Missing baseline: {original}")
    with Image.open(original) as before, Image.open(path) as after:
        if before.size != after.size:
            raise SystemExit(f"Different dimensions: {path.name}")
        diff = ImageChops.difference(before.convert("RGB"), after.convert("RGB"))
        max_channel_error = max(high for _, high in diff.getextrema())
        rows.append({
            "file": path.name,
            "equal_pixels": diff.getbbox() is None,
            "mean_absolute_channel_error": sum(ImageStat.Stat(diff).mean) / 3,
            "max_channel_error": max_channel_error,
            "difference_bounds": diff.getbbox(),
            "within_one_channel_level": max_channel_error <= 1,
            "before_sha256": sha256(original.read_bytes()).hexdigest(),
            "after_sha256": sha256(path.read_bytes()).hexdigest(),
        })
if len(rows) != 22:
    raise SystemExit(f"Expected 22 captures, found {len(rows)}")
report = {
    "timestamp": datetime.now(timezone.utc).isoformat(),
    "baseline": str(baseline),
    "current": str(current),
    "scope": "Eight trains, twelve detail variants and two mobile views; paused at initial phase. No image editing or resampling.",
    "tolerance": "At most one level per 8-bit color channel; exact equality is reported separately. Review difference bounds for any nonidentical capture.",
    "rows": rows,
}
(current.parent / "visual-comparison.json").write_text(json.dumps(report, indent=2) + "\n")
identical = sum(row["equal_pixels"] for row in rows)
print(f"Pixel-identical captures: {identical}/{len(rows)}")
tolerated = sum(row["within_one_channel_level"] for row in rows)
print(f"Captures within one channel level: {tolerated}/{len(rows)}")
if tolerated != len(rows):
    raise SystemExit("Review changed captures before publishing.")

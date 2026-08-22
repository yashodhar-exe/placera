import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)
UPLOAD_DIR = DATA_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

DATABASE_URL = f"sqlite:///{DATA_DIR / 'campus_placement.db'}"

# Placement Policy Defaults
TIER_POLICIES = {
    "DREAM": {"min_ctc": 15.0, "allow_upgrades_from": ["TIER_1", "TIER_2", "UNPLACED"]},
    "TIER_1": {"min_ctc": 8.0, "allow_upgrades_from": ["TIER_2", "UNPLACED"]},
    "TIER_2": {"min_ctc": 4.0, "allow_upgrades_from": ["UNPLACED"]}
}

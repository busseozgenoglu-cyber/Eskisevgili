#!/usr/bin/env python3
"""
Fix App Store Connect submission blockers:
1. Create app store review detail
2. Set age rating via appInfos
"""
import json
import time
import jwt
import requests

KEY_ID = "YPJ32NPYCP"
ISSUER_ID = "ebf02110-40ae-4668-b584-654d16078611"
APP_ID = "6761690112"
VERSION_ID = "2466256e-f9ba-4bb8-8fc9-ab0218e18b0a"
BASE_URL = "https://api.appstoreconnect.apple.com/v1"

with open("fastlane/api_key.json") as f:
    cfg = json.load(f)
PRIVATE_KEY = cfg["key"]


def make_token():
    now = int(time.time())
    payload = {"iss": ISSUER_ID, "iat": now, "exp": now + 1200, "aud": "appstoreconnect-v1"}
    return jwt.encode(payload, PRIVATE_KEY, algorithm="ES256", headers={"kid": KEY_ID})


def hdr():
    return {"Authorization": f"Bearer {make_token()}", "Content-Type": "application/json"}


def get(path, params=None):
    r = requests.get(f"{BASE_URL}{path}", headers=hdr(), params=params)
    r.raise_for_status()
    return r.json()


def post(path, body):
    r = requests.post(f"{BASE_URL}{path}", headers=hdr(), json=body)
    if not r.ok:
        print(f"  POST {path} FAILED {r.status_code}: {r.text[:600]}")
        return None
    return r.json()


def patch(path, body):
    r = requests.patch(f"{BASE_URL}{path}", headers=hdr(), json=body)
    if not r.ok:
        print(f"  PATCH {path} FAILED {r.status_code}: {r.text[:600]}")
        return None
    return r.json()


# ── 1. Create review detail ─────────────────────────────────────────────────
print("1. Creating review detail...")
resp = post("/appStoreReviewDetails", {
    "data": {
        "type": "appStoreReviewDetails",
        "attributes": {
            "contactFirstName": "Buse",
            "contactLastName": "Ozgenoglu",
            "contactEmail": "ozgenoglubuse@gmail.com",
            "contactPhone": "+90 530 000 0000",
            "demoAccountRequired": False,
            "notes": "AI chat app. Users describe their ex-partner and chat with the AI. No demo account needed."
        },
        "relationships": {
            "appStoreVersion": {"data": {"type": "appStoreVersions", "id": VERSION_ID}}
        }
    }
})
if resp:
    print(f"  Created: {resp['data']['id']}")
else:
    # Try to fetch existing
    try:
        rd = get(f"/appStoreVersions/{VERSION_ID}/appStoreReviewDetail")
        if rd.get("data"):
            rd_id = rd["data"]["id"]
            print(f"  Already exists ({rd_id}), patching...")
            patch(f"/appStoreReviewDetails/{rd_id}", {
                "data": {
                    "type": "appStoreReviewDetails",
                    "id": rd_id,
                    "attributes": {
                        "contactFirstName": "Buse",
                        "contactLastName": "Ozgenoglu",
                        "contactEmail": "ozgenoglubuse@gmail.com",
                        "contactPhone": "+90 530 000 0000",
                        "demoAccountRequired": False,
                        "notes": "AI chat app. Users describe their ex and chat with the AI."
                    }
                }
            })
            print("  Patched.")
        else:
            print("  No review detail found either.")
    except Exception as e:
        print(f"  Could not fetch: {e}")


# ── 2. Age rating via appInfos ───────────────────────────────────────────────
print("\n2. Setting age rating via appInfos...")
try:
    infos = get(f"/apps/{APP_ID}/appInfos")
    app_info = infos["data"][0] if infos.get("data") else None
    if not app_info:
        print("  No appInfo found")
    else:
        info_id = app_info["id"]
        print(f"  appInfo ID: {info_id}")
        # Get the ageRatingDeclaration linked to this appInfo
        try:
            ar = get(f"/appInfos/{info_id}/ageRatingDeclaration")
            if ar.get("data"):
                ar_id = ar["data"]["id"]
                print(f"  ageRatingDeclaration ID: {ar_id}, updating...")
                result = patch(f"/ageRatingDeclarations/{ar_id}", {
                    "data": {
                        "type": "ageRatingDeclarations",
                        "id": ar_id,
                        "attributes": {
                            "alcoholTobaccoOrDrugUseOrReferences": "NONE",
                            "contests": "NONE",
                            "gambling": False,
                            "gamblingSimulated": "NONE",
                            "horrorOrFearThemes": "NONE",
                            "matureOrSuggestiveThemes": "NONE",
                            "medicalOrTreatmentInformation": "NONE",
                            "profanityOrCrudeHumor": "NONE",
                            "sexualContentGraphicAndNudity": "NONE",
                            "sexualContentOrNudity": "NONE",
                            "unrestrictedWebAccess": False,
                            "violenceCartoonOrFantasy": "NONE",
                            "violenceRealistic": "NONE",
                            "violenceRealisticProlongedGraphicOrSadistic": "NONE",
                            "gunsOrOtherWeapons": "NONE",
                        }
                    }
                })
                if result:
                    print(f"  Age rating updated OK")
            else:
                print("  No ageRatingDeclaration under appInfo")
        except Exception as e:
            print(f"  ageRatingDeclaration fetch failed: {e}")
except Exception as e:
    print(f"  appInfos failed: {e}")


# ── 3. Check what's still missing ────────────────────────────────────────────
print("\n3. Checking version state...")
try:
    v = get(f"/appStoreVersions/{VERSION_ID}")
    attrs = v["data"]["attributes"]
    print(f"  State: {attrs['appStoreState']}")
    print(f"  Version: {attrs['versionString']}")
except Exception as e:
    print(f"  {e}")

print("\nDone. Run fastlane deliver again to submit.")

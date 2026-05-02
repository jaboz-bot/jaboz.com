"""CI: fail if CF_TOKEN / CF_ACCOUNT contain non-ASCII (causes Wrangler ByteString error)."""
import os
import sys


def main() -> None:
    for key in ("CF_TOKEN", "CF_ACCOUNT"):
        v = os.environ.get(key, "")
        if not v:
            print(f"::error::Missing {key}")
            sys.exit(1)
        for i, ch in enumerate(v):
            if ord(ch) > 127:
                print(
                    f"::error::{key} has non-ASCII at index {i} (code {ord(ch)}). "
                    "Re-paste from Cloudflare in Notepad; remove arrows or smart quotes."
                )
                sys.exit(1)
    acct = os.environ["CF_ACCOUNT"].strip()
    hexset = set("0123456789abcdef")
    if len(acct) != 32 or any(c.lower() not in hexset for c in acct):
        print(
            "::warning::CLOUDFLARE_ACCOUNT_ID should be 32 hex characters (no hyphens). "
            "Verify in Cloudflare Dashboard."
        )
    print("Secrets: ASCII OK")


if __name__ == "__main__":
    main()

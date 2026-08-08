"""
storage.py — S3-backed persistence for Frontier analysis results.

Every completed analysis is saved as a JSON object in S3, keyed by a
UUID and timestamp, so users can browse and reload past runs without
re-fetching market data or re-running Monte Carlo simulation.

Summary fields (id, created_at, tickers) are packed into the object key
itself, so listing history costs a single list_objects_v2 call with no
follow-up object reads. (S3 does support user-defined object metadata,
but ListObjectsV2 does not return it — only HeadObject/GetObject do,
which would put us back to one request per record.)

Requires these environment variables (see .env.example):
    AWS_ACCESS_KEY_ID
    AWS_SECRET_ACCESS_KEY
    AWS_REGION            (e.g. us-east-1)
    S3_BUCKET_NAME
"""

import json
import logging
import os
import re
import threading
import uuid
from datetime import datetime, timezone
from typing import Optional

import boto3
from botocore.exceptions import BotoCoreError, ClientError

logger = logging.getLogger(__name__)

BUCKET = os.getenv("S3_BUCKET_NAME")
REGION = os.getenv("AWS_REGION", "us-east-1")

PREFIX = "analyses/"

# Object keys look like:  analyses/<id>__<YYYYmmddTHHMMSSZ>__<TICKER_TICKER>.json
# The id comes first so a single analysis can be resolved with a prefix query.
KEY_SEP = "__"
TICKER_SEP = "_"
TS_FORMAT = "%Y%m%dT%H%M%SZ"

# Upper bound on keys examined by list_history in one request.
MAX_KEYS = 200

# Characters S3 keys handle without escaping; tickers are stripped to these.
_UNSAFE_KEY_CHARS = re.compile(r"[^A-Za-z0-9.\-]")

_s3_client = None

# Analyses handed to the background uploader but not yet in S3.
#
# The upload no longer blocks the response, which opens a window where a
# client holding a fresh analysis_id could ask for it before the object
# exists. Staging the record here — synchronously, before the response goes
# out — closes that window: get_analysis and list_history consult this first.
#
# Bounded by the number of uploads in flight, not by traffic: entries are
# dropped as soon as the upload settles. Touched from worker threads, hence
# the lock.
_pending: dict[str, tuple[datetime, dict]] = {}
_pending_lock = threading.Lock()


def get_client():
    """Lazily create the S3 client so the app can still run locally
    without AWS credentials configured — storage becomes a no-op."""
    global _s3_client
    if _s3_client is None:
        _s3_client = boto3.client("s3", region_name=REGION)
    return _s3_client


def storage_enabled() -> bool:
    return bool(BUCKET) and bool(os.getenv("AWS_ACCESS_KEY_ID"))


def _encode_key(analysis_id: str, created_at: datetime, tickers: list[str]) -> str:
    """Build an object key that carries the whole summary record."""
    stamp = created_at.strftime(TS_FORMAT)
    safe_tickers = TICKER_SEP.join(_UNSAFE_KEY_CHARS.sub("", t) for t in tickers)
    return f"{PREFIX}{analysis_id}{KEY_SEP}{stamp}{KEY_SEP}{safe_tickers}.json"


def _decode_key(key: str) -> Optional[dict]:
    """Recover the summary from an object key, or None if it doesn't parse
    (e.g. an object written by an older version of this module)."""
    name = key[len(PREFIX):]
    if name.endswith(".json"):
        name = name[: -len(".json")]

    parts = name.split(KEY_SEP)
    if len(parts) != 3:
        return None
    analysis_id, stamp, packed_tickers = parts

    try:
        created_at = datetime.strptime(stamp, TS_FORMAT).replace(tzinfo=timezone.utc)
    except ValueError:
        return None

    return {
        "id":         analysis_id,
        "created_at": created_at.isoformat(),
        "tickers":    [t for t in packed_tickers.split(TICKER_SEP) if t],
    }


def new_analysis_id() -> str:
    """Allocate an id before the analysis is persisted, so the response can
    carry it while the upload is still pending.

    12 hex chars (48 bits) — collision-safe well past any realistic number
    of stored analyses, since put_object overwrites silently.
    """
    return uuid.uuid4().hex[:12]


def stage_analysis(analysis_id: str, result: dict, tickers: list[str]) -> None:
    """Hold a completed analysis in memory, ready for the background upload.

    Must be called synchronously, before the response is returned — that is
    what guarantees the record is retrievable the instant the client has the
    id. Pair every call with a flush_analysis task or the entry never clears.
    """
    if not storage_enabled():
        return

    created_at = datetime.now(timezone.utc)
    record = {
        "id":         analysis_id,
        "created_at": created_at.isoformat(),
        "tickers":    tickers,
        "result":     result,
    }
    with _pending_lock:
        _pending[analysis_id] = (created_at, record)


def flush_analysis(analysis_id: str) -> None:
    """Upload a staged analysis to S3 and release it from memory.

    Runs after the response has been sent, so failures are logged and
    swallowed: persistence has never been allowed to break an analysis
    request, and now it cannot delay one either.
    """
    with _pending_lock:
        entry = _pending.get(analysis_id)
    if entry is None:
        return
    created_at, record = entry

    try:
        get_client().put_object(
            Bucket=BUCKET,
            Key=_encode_key(analysis_id, created_at, record["tickers"]),
            Body=json.dumps(record).encode("utf-8"),
            ContentType="application/json",
        )
    except (ClientError, BotoCoreError):
        logger.warning("Failed to save analysis %s", analysis_id, exc_info=True)
    finally:
        # Dropped either way. A failed upload means the id the client already
        # holds resolves to nothing — the same 404 it would get for any
        # unknown id, and the tradeoff for not blocking on the write.
        with _pending_lock:
            _pending.pop(analysis_id, None)


def get_analysis(analysis_id: str) -> Optional[dict]:
    """Retrieve a single saved analysis by id."""
    # Still in flight? Serve the staged copy — byte-for-byte what the upload
    # will write — so a client that asks immediately never sees a 404.
    with _pending_lock:
        entry = _pending.get(analysis_id)
    if entry is not None:
        return entry[1]

    if not storage_enabled():
        return None

    try:
        # The key carries a timestamp and tickers after the id, so resolve
        # the full key with a prefix query before fetching the object.
        listing = get_client().list_objects_v2(
            Bucket=BUCKET, Prefix=f"{PREFIX}{analysis_id}{KEY_SEP}", MaxKeys=1
        )
        contents = listing.get("Contents", [])
        if not contents:
            return None

        obj = get_client().get_object(Bucket=BUCKET, Key=contents[0]["Key"])
        return json.loads(obj["Body"].read())
    except (ClientError, BotoCoreError):
        logger.warning("Failed to load analysis %s", analysis_id, exc_info=True)
        return None
    except json.JSONDecodeError:
        logger.warning("Stored analysis %s is not valid JSON", analysis_id)
        return None


def list_history(limit: int = 20) -> list[dict]:
    """Return a lightweight summary (id, timestamp, tickers) of the most
    recent saved analyses, newest first.

    Every field comes from the object keys returned by a single
    list_objects_v2 call, so no objects are downloaded.
    """
    if not storage_enabled():
        return []

    try:
        # No pagination: at most MAX_KEYS objects are examined. S3 returns
        # keys in lexicographic order and keys begin with a random id, so
        # beyond MAX_KEYS stored analyses this window is an arbitrary subset
        # and "newest first" holds only within it.
        resp = get_client().list_objects_v2(
            Bucket=BUCKET, Prefix=PREFIX, MaxKeys=MAX_KEYS
        )
    except (ClientError, BotoCoreError):
        logger.warning("Failed to list history", exc_info=True)
        return []

    summaries = [s for s in (_decode_key(o["Key"]) for o in resp.get("Contents", [])) if s]

    # Fold in anything still uploading, so a just-finished analysis appears in
    # the list as well as being fetchable by id. Keyed by id, since an upload
    # can land between the two reads and show up in both.
    with _pending_lock:
        staged = [{"id": aid, "created_at": rec["created_at"], "tickers": rec["tickers"]}
                  for aid, (_, rec) in _pending.items()]
    if staged:
        merged = {s["id"]: s for s in summaries}
        merged.update({s["id"]: s for s in staged})
        summaries = list(merged.values())

    summaries.sort(key=lambda s: s["created_at"], reverse=True)
    return summaries[:limit]

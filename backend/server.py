from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form, Header, Query
from fastapi.responses import Response, FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import random
import string
import asyncio
import requests
import bcrypt
import jwt
import hmac
import hashlib
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Local upload fallback directory
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)


def _build_mongo_url() -> Optional[str]:
    """Resolves the MongoDB connection string.

    Prefers Railway's MONGO_URL (provided by the MongoDB template). Falls back
    to constructing a URL from the individual MONGOHOST/MONGOPORT/MONGOUSER/
    MONGOPASSWORD variables, and finally to a local MONGO_URL/MONGODB_URI env
    var for local development. Returns None if nothing is configured.
    """
    mongo_url = os.environ.get('MONGO_URL') or os.environ.get('MONGODB_URI')
    if mongo_url:
        return mongo_url

    mongo_host = os.environ.get('MONGOHOST')
    if mongo_host:
        mongo_port = os.environ.get('MONGOPORT', '27017')
        mongo_user = os.environ.get('MONGOUSER')
        mongo_password = os.environ.get('MONGOPASSWORD')
        if mongo_user and mongo_password:
            return f"mongodb://{mongo_user}:{mongo_password}@{mongo_host}:{mongo_port}"
        return f"mongodb://{mongo_host}:{mongo_port}"

    return None


# MongoDB
mongo_url = _build_mongo_url()
if mongo_url:
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ.get('DB_NAME', 'pitchplay')]
else:
    logging.getLogger(__name__).warning(
        "No MongoDB connection configured (MONGO_URL/MONGOHOST not set). "
        "Database-dependent features will be unavailable until a MongoDB "
        "service is attached."
    )
    client = None
    db = None

# JWT / Admin config
JWT_SECRET = os.environ.get('JWT_SECRET', 'pitchplay_super_secure_jwt_secret_key_2026')
JWT_ALG = "HS256"
JWT_EXP_DAYS = 30
ADMIN_MOBILE = os.environ.get('ADMIN_MOBILE', '9602341799')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'admin123')
ADMIN_UPI_ID = os.environ.get('ADMIN_UPI_ID', '9602341799@upi')

# Storage
STORAGE_BASE = (os.environ.get("INTEGRATION_PROXY_URL") or "").strip() or "https://integrations.emergentagent.com"
STORAGE_URL = STORAGE_BASE.rstrip("/") + "/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = os.environ.get("APP_NAME", "fantasy-contest")
storage_key: Optional[str] = None

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def init_storage(force: bool = False):
    global storage_key
    if not EMERGENT_KEY:
        return None
    if storage_key and not force:
        return storage_key
    try:
        resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=10)
        resp.raise_for_status()
        storage_key = resp.json()["storage_key"]
        return storage_key
    except Exception as e:
        logger.warning(f"Emergent storage not available ({e}), using local disk fallback.")
        return None


def save_file_data(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    if key:
        try:
            resp = requests.put(
                f"{STORAGE_URL}/objects/{path}",
                headers={"X-Storage-Key": key, "Content-Type": content_type},
                data=data,
                timeout=30,
            )
            resp.raise_for_status()
            return {"path": path}
        except Exception as e:
            logger.warning(f"Remote storage failed ({e}), falling back to local disk.")

    # Local disk fallback
    safe_name = path.replace("/", "_").replace("\\", "_")
    local_path = UPLOAD_DIR / safe_name
    with open(local_path, "wb") as f:
        f.write(data)
    return {"path": f"local/{safe_name}"}


def get_file_data(path: str) -> tuple[bytes, str]:
    if path.startswith("local/"):
        filename = path.replace("local/", "")
        local_path = UPLOAD_DIR / filename
        if not local_path.exists():
            raise FileNotFoundError(f"Local file {filename} not found")
        with open(local_path, "rb") as f:
            data = f.read()
        ext = filename.rsplit(".", 1)[-1].lower()
        mime = "image/png" if ext == "png" else "image/jpeg" if ext in ("jpg", "jpeg") else "application/octet-stream"
        return data, mime

    key = init_storage()
    if key:
        resp = requests.get(
            f"{STORAGE_URL}/objects/{path}",
            headers={"X-Storage-Key": key},
            timeout=30,
        )
        resp.raise_for_status()
        return resp.content, resp.headers.get("Content-Type", "application/octet-stream")

    # Check local fallback as well
    safe_name = path.replace("/", "_").replace("\\", "_")
    local_path = UPLOAD_DIR / safe_name
    if local_path.exists():
        with open(local_path, "rb") as f:
            return f.read(), "image/png"
    raise FileNotFoundError(f"File {path} not found")


app = FastAPI(title="PitchPlay API", version="2.0")
api_router = APIRouter(prefix="/api")


# ---------- Utilities ----------
def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False


def create_token(user_id: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(days=JWT_EXP_DAYS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


def generate_referral_code() -> str:
    chars = string.ascii_uppercase + string.digits
    return "PP" + "".join(random.choices(chars, k=6))


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def get_user_balances(user_doc: Optional[dict]):
    """Calculates normalized deposit, winnings, and total wallet balances."""
    if not user_doc:
        return 0.0, 0.0, 0.0
    deposit = float(user_doc.get("deposit_balance", 0.0))
    # Fallback for legacy users: treat any balance above deposit as winnings
    winnings = float(user_doc.get("winnings_balance", max(0.0, float(user_doc.get("wallet_balance", 0.0)) - deposit)))
    total = round(deposit + winnings, 2)
    return round(deposit, 2), round(winnings, 2), total


async def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing authentication token")
    token = authorization.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    if user.get("blocked"):
        raise HTTPException(status_code=403, detail="Account is blocked. Contact admin.")
    return user


async def require_admin(user=Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin permissions required")
    return user


async def notify_user(user_id: str, title: str, message: str, notif_type: str = "system"):
    """Helper to create an in-app notification"""
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "title": title,
        "message": message,
        "type": notif_type,
        "read": False,
        "created_at": now_iso(),
    }
    await db.notifications.insert_one(doc)


# ---------- Pydantic Models ----------
class SignupBody(BaseModel):
    name: str = Field(min_length=1, max_length=60)
    mobile: str = Field(min_length=6, max_length=15)
    password: str = Field(min_length=4, max_length=100)
    referral_code: Optional[str] = None


class LoginBody(BaseModel):
    mobile: str
    password: str


class SendOtpBody(BaseModel):
    mobile: str = Field(min_length=6, max_length=15)


class VerifyOtpBody(BaseModel):
    mobile: str = Field(min_length=6, max_length=15)
    otp: str = Field(min_length=4, max_length=8)
    name: Optional[str] = None
    referral_code: Optional[str] = None


class ContestCreate(BaseModel):
    title: str
    description: str = ""
    external_link: str
    entry_fee: float
    prize_pool: float
    max_participants: int = 100
    match_time: Optional[str] = None
    scheduled_open_time: Optional[str] = None
    scheduled_close_time: Optional[str] = None
    prize_distribution: Optional[List[dict]] = None


class ContestUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    external_link: Optional[str] = None
    entry_fee: Optional[float] = None
    prize_pool: Optional[float] = None
    max_participants: Optional[int] = None
    match_time: Optional[str] = None
    scheduled_open_time: Optional[str] = None
    scheduled_close_time: Optional[str] = None
    status: Optional[str] = None
    prize_distribution: Optional[List[dict]] = None


class ContestRankingItem(BaseModel):
    entry_id: str
    rank: int
    points: float = 0.0


class ContestSettleBody(BaseModel):
    rankings: List[ContestRankingItem]
    auto_distribute: bool = True
    manual_payouts: Optional[Dict[str, float]] = None


class WithdrawalCreate(BaseModel):
    amount: float
    upi_id: str


class DeclareWinnerBody(BaseModel):
    entry_id: str
    prize_amount: float


class ApproveBody(BaseModel):
    action: str  # "approve" or "reject"
    note: Optional[str] = None
    utr: Optional[str] = None


class AdminUserCreate(BaseModel):
    name: str = Field(min_length=1, max_length=60)
    mobile: str = Field(min_length=6, max_length=15)
    password: str = Field(min_length=4, max_length=100)
    wallet_balance: float = 0.0


class WalletAdjustBody(BaseModel):
    amount: float
    note: Optional[str] = None


class BlockBody(BaseModel):
    blocked: bool


class PaymentSettingsBody(BaseModel):
    upi_id: str = Field(min_length=3, max_length=100)
    payee_name: str = Field(default="", max_length=60)
    instructions: str = Field(default="", max_length=500)
    razorpay_key_id: Optional[str] = ""
    razorpay_key_secret: Optional[str] = ""
    razorpay_payment_link: Optional[str] = ""


class BroadcastNotificationBody(BaseModel):
    title: str
    message: str
    user_id: Optional[str] = "all"
    type: Optional[str] = "system"


class DepositCreateBody(BaseModel):
    amount: float = Field(gt=0, le=100000)
    upi_app: Optional[str] = "generic"


class DepositVerifyBody(BaseModel):
    order_id: str
    utr: Optional[str] = None
    simulated: Optional[bool] = False


class WalletJoinBody(BaseModel):
    contest_id: str


class RazorpayOrderCreate(BaseModel):
    amount: float = Field(gt=0, le=100000)


class RazorpayVerifyBody(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: Optional[str] = None
    amount: float


class RazorpayTestBody(BaseModel):
    key_id: str
    key_secret: str


def verify_razorpay_signature(order_id: str, payment_id: str, signature: str, secret: str) -> bool:
    if not secret or not signature:
        return False
    msg = f"{order_id}|{payment_id}".encode("utf-8")
    expected = hmac.new(secret.encode("utf-8"), msg, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)


async def get_payment_settings() -> dict:
    s = await db.settings.find_one({"key": "payment"}, {"_id": 0})
    if not s:
        s = {
            "key": "payment",
            "upi_id": ADMIN_UPI_ID,
            "payee_name": "Admin",
            "instructions": "",
            "razorpay_key_id": os.environ.get("RAZORPAY_KEY_ID", ""),
            "razorpay_key_secret": os.environ.get("RAZORPAY_KEY_SECRET", ""),
            "razorpay_payment_link": os.environ.get("RAZORPAY_PAYMENT_LINK", ""),
        }
    else:
        # Fall back to env variables if settings fields are empty
        if not s.get("razorpay_key_id") and os.environ.get("RAZORPAY_KEY_ID"):
            s["razorpay_key_id"] = os.environ.get("RAZORPAY_KEY_ID")
        if not s.get("razorpay_key_secret") and os.environ.get("RAZORPAY_KEY_SECRET"):
            s["razorpay_key_secret"] = os.environ.get("RAZORPAY_KEY_SECRET")
        if not s.get("razorpay_payment_link") and os.environ.get("RAZORPAY_PAYMENT_LINK"):
            s["razorpay_payment_link"] = os.environ.get("RAZORPAY_PAYMENT_LINK")
    return s


# ---------- Authentication & Referral Endpoints ----------
@api_router.post("/auth/signup")
async def signup(body: SignupBody):
    mobile = body.mobile.strip()
    existing = await db.users.find_one({"mobile": mobile})
    if existing:
        raise HTTPException(status_code=400, detail="Mobile already registered")

    user_id = str(uuid.uuid4())
    my_ref_code = generate_referral_code()
    initial_balance = 0.0

    # Process referral if given
    referred_by = None
    if body.referral_code:
        ref_code = body.referral_code.strip().upper()
        referrer = await db.users.find_one({"referral_code": ref_code}, {"_id": 0})
        if referrer and referrer["id"] != user_id:
            referred_by = referrer["id"]
            # Signup bonus for new user
            initial_balance = 20.0
            # Referral reward for referrer
            await db.users.update_one({"id": referrer["id"]}, {"$inc": {"wallet_balance": 50.0, "deposit_balance": 50.0}})
            await db.wallet_logs.insert_one({
                "id": str(uuid.uuid4()), "user_id": referrer["id"], "amount": 50.0,
                "note": f"Referral bonus from {body.name.strip()}", "type": "credit", "created_at": now_iso()
            })
            await notify_user(referrer["id"], "🎉 Referral Bonus Received!", f"You earned ₹50 for referring {body.name.strip()}!", "reward")

    doc = {
        "id": user_id,
        "name": body.name.strip(),
        "mobile": mobile,
        "password_hash": hash_password(body.password),
        "role": "user",
        "wallet_balance": initial_balance,
        "deposit_balance": initial_balance,
        "winnings_balance": 0.0,
        "referral_code": my_ref_code,
        "referred_by": referred_by,
        "created_at": now_iso(),
    }
    await db.users.insert_one(doc)

    if initial_balance > 0:
        await db.wallet_logs.insert_one({
            "id": str(uuid.uuid4()), "user_id": user_id, "amount": initial_balance,
            "note": "Welcome bonus (Referral)", "type": "credit", "created_at": now_iso()
        })
        await notify_user(user_id, "🎁 Welcome Bonus!", f"₹{initial_balance} welcome credit added to your wallet!", "reward")

    token = create_token(user_id, "user")
    return {
        "token": token,
        "user": {
            "id": user_id,
            "name": doc["name"],
            "mobile": mobile,
            "role": "user",
            "wallet_balance": initial_balance,
            "deposit_balance": initial_balance,
            "winnings_balance": 0.0,
            "referral_code": my_ref_code,
        }
    }


@api_router.post("/auth/login")
async def login(body: LoginBody):
    mobile = body.mobile.strip()
    user = await db.users.find_one({"mobile": mobile}, {"_id": 0})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid mobile or password")
    if user.get("blocked"):
        raise HTTPException(status_code=403, detail="Your account is blocked. Contact admin.")

    # Ensure user has referral code
    if not user.get("referral_code"):
        code = generate_referral_code()
        await db.users.update_one({"id": user["id"]}, {"$set": {"referral_code": code}})
        user["referral_code"] = code

    dep_bal, win_bal, tot_bal = get_user_balances(user)
    token = create_token(user["id"], user["role"])
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "mobile": user["mobile"],
            "role": user["role"],
            "wallet_balance": tot_bal,
            "deposit_balance": dep_bal,
            "winnings_balance": win_bal,
            "referral_code": user.get("referral_code"),
        },
    }


@api_router.post("/auth/send-otp")
async def send_otp(body: SendOtpBody):
    """Generates a 6-digit OTP with mock SMS dispatch"""
    mobile = body.mobile.strip()
    otp_code = str(random.randint(100000, 999999))
    # In demo/local mode, fixed or generated OTP
    await db.otps.update_one(
        {"mobile": mobile},
        {"$set": {"otp": otp_code, "created_at": now_iso(), "expires_at": (datetime.now(timezone.utc) + timedelta(minutes=5)).isoformat()}},
        upsert=True
    )
    logger.info(f"Generated OTP for {mobile}: {otp_code}")
    return {"ok": True, "otp": otp_code, "message": f"Demo OTP is {otp_code} (Valid for 5 minutes)"}


@api_router.post("/auth/verify-otp")
async def verify_otp(body: VerifyOtpBody):
    """Verifies OTP and logs in / registers the user"""
    mobile = body.mobile.strip()
    otp_record = await db.otps.find_one({"mobile": mobile})
    if not otp_record or otp_record.get("otp") != body.otp.strip():
        # Allow default test OTP 123456 as well
        if body.otp.strip() != "123456":
            raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    # Find or auto-register user
    user = await db.users.find_one({"mobile": mobile}, {"_id": 0})
    if not user:
        user_id = str(uuid.uuid4())
        ref_code = generate_referral_code()
        initial_balance = 0.0
        name = body.name.strip() if body.name else f"Player_{mobile[-4:]}"

        referred_by = None
        if body.referral_code:
            ref_referrer = await db.users.find_one({"referral_code": body.referral_code.strip().upper()})
            if ref_referrer:
                referred_by = ref_referrer["id"]
                initial_balance = 20.0
                await db.users.update_one({"id": ref_referrer["id"]}, {"$inc": {"wallet_balance": 50.0, "deposit_balance": 50.0}})
                await notify_user(ref_referrer["id"], "🎉 Referral Bonus!", f"₹50 received for inviting {name}!", "reward")

        user = {
            "id": user_id,
            "name": name,
            "mobile": mobile,
            "password_hash": hash_password("otp_user_" + str(uuid.uuid4())),
            "role": "user",
            "wallet_balance": initial_balance,
            "deposit_balance": initial_balance,
            "winnings_balance": 0.0,
            "referral_code": ref_code,
            "referred_by": referred_by,
            "created_at": now_iso(),
        }
        await db.users.insert_one(user)
    else:
        if user.get("blocked"):
            raise HTTPException(status_code=403, detail="Account is blocked.")
        if not user.get("referral_code"):
            code = generate_referral_code()
            await db.users.update_one({"id": user["id"]}, {"$set": {"referral_code": code}})
            user["referral_code"] = code

    # Invalidate OTP after use
    await db.otps.delete_one({"mobile": mobile})
    token = create_token(user["id"], user["role"])
    dep_bal, win_bal, tot_bal = get_user_balances(user)
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "mobile": user["mobile"],
            "role": user["role"],
            "wallet_balance": tot_bal,
            "deposit_balance": dep_bal,
            "winnings_balance": win_bal,
            "referral_code": user.get("referral_code"),
        }
    }


@api_router.get("/auth/me")
async def me(user=Depends(get_current_user)):
    dep_bal, win_bal, tot_bal = get_user_balances(user)
    return {
        "id": user["id"],
        "name": user["name"],
        "mobile": user["mobile"],
        "role": user["role"],
        "wallet_balance": tot_bal,
        "deposit_balance": dep_bal,
        "winnings_balance": win_bal,
        "referral_code": user.get("referral_code"),
    }


# ---------- Referral Stats ----------
@api_router.get("/referral/stats")
async def referral_stats(user=Depends(get_current_user)):
    ref_code = user.get("referral_code")
    if not ref_code:
        ref_code = generate_referral_code()
        await db.users.update_one({"id": user["id"]}, {"$set": {"referral_code": ref_code}})

    referred_users = await db.users.find({"referred_by": user["id"]}, {"_id": 0, "name": 1, "created_at": 1}).to_list(100)
    total_earnings = len(referred_users) * 50.0

    return {
        "referral_code": ref_code,
        "bonus_per_referral": 50.0,
        "friend_bonus": 20.0,
        "total_referrals": len(referred_users),
        "total_earnings": total_earnings,
        "referred_friends": referred_users,
    }


# ---------- Notifications System ----------
@api_router.get("/notifications/mine")
async def my_notifications(user=Depends(get_current_user)):
    # User's notifications + broadcast notifications
    items = await db.notifications.find(
        {"$or": [{"user_id": user["id"]}, {"user_id": "all"}]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    unread_count = sum(1 for n in items if not n.get("read"))
    return {"notifications": items, "unread_count": unread_count}


@api_router.post("/notifications/{nid}/read")
async def mark_notification_read(nid: str, user=Depends(get_current_user)):
    await db.notifications.update_one(
        {"id": nid, "$or": [{"user_id": user["id"]}, {"user_id": "all"}]},
        {"$set": {"read": True}}
    )
    return {"ok": True}


@api_router.post("/notifications/read-all")
async def mark_all_notifications_read(user=Depends(get_current_user)):
    await db.notifications.update_many(
        {"$or": [{"user_id": user["id"]}, {"user_id": "all"}]},
        {"$set": {"read": True}}
    )
    return {"ok": True}


@api_router.post("/notifications/create")
async def create_broadcast_notification(body: BroadcastNotificationBody, admin=Depends(require_admin)):
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": body.user_id or "all",
        "title": body.title,
        "message": body.message,
        "type": body.type or "system",
        "read": False,
        "created_at": now_iso(),
    }
    await db.notifications.insert_one(doc)
    doc.pop("_id", None)
    return doc


# ---------- Multi-Tier Prize Pool Distribution Engine ----------
def generate_default_prize_breakup(prize_pool: float, max_participants: int = 100) -> List[dict]:
    """Generates standard multi-tier Dream11-style prize pool distribution."""
    prize_pool = float(prize_pool or 0.0)
    if prize_pool <= 0:
        return []

    if max_participants <= 2:
        return [
            {"rank_from": 1, "rank_to": 1, "label": "Rank 1", "percentage": 100.0, "prize": round(prize_pool, 2), "winners_count": 1, "prize_per_winner": round(prize_pool, 2)}
        ]
    elif max_participants <= 5:
        p1 = round(prize_pool * 0.70, 2)
        p2 = round(prize_pool * 0.30, 2)
        return [
            {"rank_from": 1, "rank_to": 1, "label": "Rank 1", "percentage": 70.0, "prize": p1, "winners_count": 1, "prize_per_winner": p1},
            {"rank_from": 2, "rank_to": 2, "label": "Rank 2", "percentage": 30.0, "prize": p2, "winners_count": 1, "prize_per_winner": p2},
        ]
    elif max_participants <= 10:
        p1 = round(prize_pool * 0.50, 2)
        p2 = round(prize_pool * 0.30, 2)
        p3 = round(prize_pool * 0.20, 2)
        return [
            {"rank_from": 1, "rank_to": 1, "label": "Rank 1", "percentage": 50.0, "prize": p1, "winners_count": 1, "prize_per_winner": p1},
            {"rank_from": 2, "rank_to": 2, "label": "Rank 2", "percentage": 30.0, "prize": p2, "winners_count": 1, "prize_per_winner": p2},
            {"rank_from": 3, "rank_to": 3, "label": "Rank 3", "percentage": 20.0, "prize": p3, "winners_count": 1, "prize_per_winner": p3},
        ]
    elif max_participants <= 50:
        p1 = round(prize_pool * 0.40, 2)
        p2 = round(prize_pool * 0.25, 2)
        p3 = round(prize_pool * 0.15, 2)
        p4 = round(prize_pool * 0.10, 2)
        p5 = round(prize_pool * 0.10, 2)
        return [
            {"rank_from": 1, "rank_to": 1, "label": "Rank 1", "percentage": 40.0, "prize": p1, "winners_count": 1, "prize_per_winner": p1},
            {"rank_from": 2, "rank_to": 2, "label": "Rank 2", "percentage": 25.0, "prize": p2, "winners_count": 1, "prize_per_winner": p2},
            {"rank_from": 3, "rank_to": 3, "label": "Rank 3", "percentage": 15.0, "prize": p3, "winners_count": 1, "prize_per_winner": p3},
            {"rank_from": 4, "rank_to": 5, "label": "Rank 4 - 5", "percentage": 10.0, "prize": p4, "winners_count": 2, "prize_per_winner": round(p4 / 2, 2)},
            {"rank_from": 6, "rank_to": 10, "label": "Rank 6 - 10", "percentage": 10.0, "prize": p5, "winners_count": 5, "prize_per_winner": round(p5 / 5, 2)},
        ]
    else:
        p1 = round(prize_pool * 0.35, 2)
        p2 = round(prize_pool * 0.20, 2)
        p3 = round(prize_pool * 0.15, 2)
        p4 = round(prize_pool * 0.10, 2)
        p5 = round(prize_pool * 0.10, 2)
        p6 = round(prize_pool * 0.10, 2)
        return [
            {"rank_from": 1, "rank_to": 1, "label": "Rank 1", "percentage": 35.0, "prize": p1, "winners_count": 1, "prize_per_winner": p1},
            {"rank_from": 2, "rank_to": 2, "label": "Rank 2", "percentage": 20.0, "prize": p2, "winners_count": 1, "prize_per_winner": p2},
            {"rank_from": 3, "rank_to": 3, "label": "Rank 3", "percentage": 15.0, "prize": p3, "winners_count": 1, "prize_per_winner": p3},
            {"rank_from": 4, "rank_to": 5, "label": "Rank 4 - 5", "percentage": 10.0, "prize": p4, "winners_count": 2, "prize_per_winner": round(p4 / 2, 2)},
            {"rank_from": 6, "rank_to": 10, "label": "Rank 6 - 10", "percentage": 10.0, "prize": p5, "winners_count": 5, "prize_per_winner": round(p5 / 5, 2)},
            {"rank_from": 11, "rank_to": 25, "label": "Rank 11 - 25", "percentage": 10.0, "prize": p6, "winners_count": 15, "prize_per_winner": round(p6 / 15, 2)},
        ]


# ---------- Contests ----------
@api_router.get("/contests")
async def list_contests(user=Depends(get_current_user)):
    pipeline = [
        {"$sort": {"created_at": -1}},
        {"$lookup": {
            "from": "entries",
            "let": {"cid": "$id"},
            "pipeline": [
                {"$match": {"$expr": {"$and": [
                    {"$eq": ["$contest_id", "$$cid"]},
                    {"$in": ["$status", ["approved", "won", "completed", "pending"]]},
                ]}}},
                {"$count": "n"},
            ],
            "as": "pc",
        }},
        {"$addFields": {"participants_count": {"$ifNull": [{"$arrayElemAt": ["$pc.n", 0]}, 0]}}},
        {"$project": {"_id": 0, "pc": 0}},
    ]
    contests = await db.contests.aggregate(pipeline).to_list(500)
    my_entries = []
    if user["role"] != "admin":
        my_entries = await db.entries.find(
            {"user_id": user["id"], "status": {"$in": ["pending", "approved", "won", "completed"]}},
            {"_id": 0, "contest_id": 1, "status": 1, "winner_prize": 1, "rank": 1}
        ).to_list(500)
    status_by_contest = {e["contest_id"]: e for e in my_entries}

    for c in contests:
        # Populate prize distribution if missing
        if not c.get("prize_distribution"):
            c["prize_distribution"] = generate_default_prize_breakup(c.get("prize_pool", 0.0), c.get("max_participants", 100))
        if user["role"] != "admin":
            ent = status_by_contest.get(c["id"])
            c["my_entry_status"] = ent["status"] if ent else None
            c["my_entry_rank"] = ent.get("rank") if ent else None
            c["my_entry_prize"] = ent.get("winner_prize", 0.0) if ent else None
            if not ent or ent["status"] not in ("approved", "won"):
                c["external_link"] = None
    return contests


@api_router.post("/contests")
async def create_contest(body: ContestCreate, admin=Depends(require_admin)):
    status = "open"
    # Auto-schedule status check
    if body.scheduled_open_time:
        try:
            open_dt = datetime.fromisoformat(body.scheduled_open_time.replace("Z", "+00:00"))
            if open_dt > datetime.now(timezone.utc):
                status = "upcoming"
        except Exception:
            pass

    prize_dist = body.prize_distribution
    if not prize_dist:
        prize_dist = generate_default_prize_breakup(body.prize_pool, body.max_participants)

    doc = {
        "id": str(uuid.uuid4()),
        "title": body.title,
        "description": body.description,
        "external_link": body.external_link,
        "entry_fee": body.entry_fee,
        "prize_pool": body.prize_pool,
        "prize_distribution": prize_dist,
        "max_participants": body.max_participants,
        "match_time": body.match_time,
        "scheduled_open_time": body.scheduled_open_time,
        "scheduled_close_time": body.scheduled_close_time,
        "status": status,
        "created_at": now_iso(),
        "created_by": admin["id"],
    }
    await db.contests.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.patch("/contests/{contest_id}")
async def update_contest(contest_id: str, body: ContestUpdate, admin=Depends(require_admin)):
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    if "prize_pool" in updates and "prize_distribution" not in updates:
        c_curr = await db.contests.find_one({"id": contest_id})
        max_p = updates.get("max_participants") or (c_curr.get("max_participants") if c_curr else 100)
        updates["prize_distribution"] = generate_default_prize_breakup(updates["prize_pool"], max_p)

    res = await db.contests.update_one({"id": contest_id}, {"$set": updates})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Contest not found")
    contest = await db.contests.find_one({"id": contest_id}, {"_id": 0})
    return contest


@api_router.delete("/contests/{contest_id}")
async def delete_contest(contest_id: str, admin=Depends(require_admin)):
    await db.contests.delete_one({"id": contest_id})
    return {"ok": True}


# ---------- Live Leaderboard & Multi-Tier Settle ----------
@api_router.get("/leaderboard/{contest_id}")
async def contest_leaderboard(contest_id: str, user=Depends(get_current_user)):
    contest = await db.contests.find_one({"id": contest_id}, {"_id": 0})
    if not contest:
        raise HTTPException(status_code=404, detail="Contest not found")

    prize_dist = contest.get("prize_distribution") or generate_default_prize_breakup(contest.get("prize_pool", 0.0), contest.get("max_participants", 100))

    entries = await db.entries.find(
        {"contest_id": contest_id, "status": {"$in": ["won", "approved", "completed", "pending"]}},
        {"_id": 0, "id": 1, "user_id": 1, "user_name": 1, "user_mobile": 1, "status": 1, "winner_prize": 1, "rank": 1, "points": 1, "created_at": 1}
    ).sort([("rank", 1), ("points", -1), ("status", -1), ("winner_prize", -1), ("created_at", 1)]).to_list(500)

    ranked = []
    for idx, e in enumerate(entries, 1):
        is_me = (e["user_id"] == user["id"])
        name = e["user_name"] if (is_me or user["role"] == "admin") else f"Player_{e['user_name'][:2]}***"
        effective_rank = e.get("rank") if e.get("rank") is not None else idx
        ranked.append({
            "rank": effective_rank,
            "entry_id": e["id"],
            "user_id": e["user_id"],
            "user_name": name,
            "user_mobile": e.get("user_mobile") if user["role"] == "admin" else None,
            "status": e["status"],
            "points": float(e.get("points", 0.0)),
            "prize": float(e.get("winner_prize", 0.0)),
            "is_me": is_me,
            "joined_at": e["created_at"],
        })

    return {
        "contest_id": contest_id,
        "contest_title": contest["title"],
        "prize_pool": contest["prize_pool"],
        "prize_distribution": prize_dist,
        "status": contest.get("status", "open"),
        "settled_at": contest.get("settled_at"),
        "participants_count": len(ranked),
        "max_participants": contest.get("max_participants", 100),
        "standings": ranked,
    }


@api_router.post("/contests/{contest_id}/settle")
async def settle_contest_payouts(contest_id: str, body: ContestSettleBody, admin=Depends(require_admin)):
    contest = await db.contests.find_one({"id": contest_id})
    if not contest:
        raise HTTPException(status_code=404, detail="Contest not found")

    prize_pool = float(contest.get("prize_pool", 0.0))
    distribution = contest.get("prize_distribution") or generate_default_prize_breakup(prize_pool, contest.get("max_participants", 100))

    if not body.rankings:
        raise HTTPException(status_code=400, detail="No participants/rankings provided for settlement")

    def get_prize_for_rank(rank_num: int) -> float:
        for slab in distribution:
            if slab.get("rank_from", 0) <= rank_num <= slab.get("rank_to", 0):
                slab_count = max(1, slab.get("rank_to", 1) - slab.get("rank_from", 1) + 1)
                total_slab_prize = slab.get("prize")
                if total_slab_prize is None:
                    pct = float(slab.get("percentage", 0.0))
                    total_slab_prize = round((pct / 100.0) * prize_pool, 2)
                return round(float(total_slab_prize) / slab_count, 2)
        return 0.0

    settled_results = []
    winners_count = 0
    total_distributed = 0.0

    for item in body.rankings:
        entry = await db.entries.find_one({"id": item.entry_id, "contest_id": contest_id})
        if not entry:
            continue

        if body.manual_payouts and item.entry_id in body.manual_payouts:
            prize = float(body.manual_payouts[item.entry_id])
        elif body.auto_distribute:
            prize = get_prize_for_rank(item.rank)
        else:
            prize = 0.0

        if prize > 0:
            winners_count += 1
            total_distributed += prize

            await db.entries.update_one(
                {"id": item.entry_id},
                {"$set": {
                    "status": "won",
                    "rank": item.rank,
                    "points": item.points,
                    "winner_prize": prize,
                    "won_at": now_iso(),
                }}
            )

            # Credit user winnings and total wallet balance
            await db.users.update_one(
                {"id": entry["user_id"]},
                {"$inc": {"wallet_balance": prize, "winnings_balance": prize}}
            )

            # Insert wallet audit log
            await db.wallet_logs.insert_one({
                "id": str(uuid.uuid4()),
                "user_id": entry["user_id"],
                "amount": prize,
                "note": f"Prize won for '{contest['title']}' (Rank #{item.rank})",
                "type": "prize",
                "created_at": now_iso(),
            })

            # Send Notification
            await notify_user(
                entry["user_id"],
                f"🏆 Contest Prize: Rank #{item.rank}!",
                f"Congratulations! You finished Rank #{item.rank} ({item.points} pts) in '{contest['title']}'. ₹{prize} has been credited to your wallet!",
                "winner"
            )

            settled_results.append({
                "entry_id": item.entry_id,
                "user_id": entry["user_id"],
                "user_name": entry["user_name"],
                "rank": item.rank,
                "points": item.points,
                "prize": prize,
                "status": "won"
            })
        else:
            await db.entries.update_one(
                {"id": item.entry_id},
                {"$set": {
                    "status": "completed",
                    "rank": item.rank,
                    "points": item.points,
                    "winner_prize": 0.0,
                }}
            )
            settled_results.append({
                "entry_id": item.entry_id,
                "user_id": entry["user_id"],
                "user_name": entry["user_name"],
                "rank": item.rank,
                "points": item.points,
                "prize": 0.0,
                "status": "completed"
            })

    # Mark contest as completed
    await db.contests.update_one(
        {"id": contest_id},
        {"$set": {
            "status": "completed",
            "settled_at": now_iso(),
            "total_settled_prize": total_distributed,
            "winners_count": winners_count
        }}
    )

    return {
        "ok": True,
        "contest_id": contest_id,
        "contest_title": contest["title"],
        "total_participants": len(body.rankings),
        "winners_count": winners_count,
        "total_distributed": round(total_distributed, 2),
        "settled_results": settled_results
    }


@api_router.get("/leaderboard/global/top")
async def global_leaderboard(user=Depends(get_current_user)):
    """Top winning players across the platform"""
    pipeline = [
        {"$match": {"status": "won"}},
        {"$group": {
            "_id": "$user_id",
            "user_name": {"$first": "$user_name"},
            "total_won": {"$sum": "$winner_prize"},
            "wins_count": {"$sum": 1},
        }},
        {"$sort": {"total_won": -1}},
        {"$limit": 10},
    ]
    top_winners = await db.entries.aggregate(pipeline).to_list(10)
    results = []
    for rank, w in enumerate(top_winners, 1):
        is_me = (w["_id"] == user["id"])
        results.append({
            "rank": rank,
            "user_id": w["_id"],
            "user_name": w["user_name"] if (is_me or user["role"] == "admin") else f"Player_{w['user_name'][:2]}***",
            "total_won": w["total_won"],
            "wins_count": w["wins_count"],
            "is_me": is_me,
        })
    return results


# ---------- Entries with Multiple Screenshot Support ----------
@api_router.post("/entries")
async def create_entry(
    contest_id: str = Form(...),
    utr: str = Form(""),
    screenshot: Optional[UploadFile] = File(None),
    screenshots: List[UploadFile] = File(default=[]),
    user=Depends(get_current_user),
):
    if user["role"] == "admin":
        raise HTTPException(status_code=400, detail="Admin cannot join contests")
    contest = await db.contests.find_one({"id": contest_id}, {"_id": 0})
    if not contest:
        raise HTTPException(status_code=404, detail="Contest not found")
    if contest.get("status") != "open":
        raise HTTPException(status_code=400, detail="Contest is not currently open for entries")

    mt = contest.get("match_time")
    if mt:
        try:
            if datetime.fromisoformat(mt.replace("Z", "+00:00")) <= datetime.now(timezone.utc):
                raise HTTPException(status_code=400, detail="Entries closed: match already started")
        except ValueError:
            pass

    existing = await db.entries.find_one(
        {"contest_id": contest_id, "user_id": user["id"], "status": {"$in": ["pending", "approved"]}}
    )
    if existing:
        raise HTTPException(status_code=400, detail="You already have an active entry for this contest")

    # Collect files from either screenshot or screenshots list
    files_to_process = []
    if screenshot:
        files_to_process.append(screenshot)
    if screenshots:
        files_to_process.extend([s for s in screenshots if s.filename])

    if not files_to_process:
        raise HTTPException(status_code=400, detail="Please upload at least one payment screenshot")

    # Save up to 3 screenshots
    saved_paths = []
    for file in files_to_process[:3]:
        data = await file.read()
        if not data:
            continue
        ext = (file.filename or "png").rsplit(".", 1)[-1].lower()
        if ext not in {"png", "jpg", "jpeg", "webp"}:
            ext = "png"
        path = f"{APP_NAME}/screenshots/{user['id']}/{uuid.uuid4()}.{ext}"
        try:
            result = save_file_data(path, data, file.content_type or "image/png")
            saved_paths.append(result["path"])
        except Exception as e:
            logger.exception("Upload failed")
            raise HTTPException(status_code=500, detail=f"Upload failed: {e}")

    if not saved_paths:
        raise HTTPException(status_code=400, detail="Failed to read uploaded screenshot")

    entry_id = str(uuid.uuid4())
    doc = {
        "id": entry_id,
        "contest_id": contest_id,
        "contest_title": contest["title"],
        "user_id": user["id"],
        "user_name": user["name"],
        "user_mobile": user["mobile"],
        "entry_fee": contest["entry_fee"],
        "utr": utr,
        "screenshot_path": saved_paths[0],
        "screenshot_paths": saved_paths,
        "status": "pending",
        "winner_prize": 0.0,
        "created_at": now_iso(),
    }
    await db.entries.insert_one(doc)
    doc.pop("_id", None)

    # Notify user that entry is submitted
    await notify_user(
        user["id"],
        "Entry Submitted 🎟️",
        f"Your entry for '{contest['title']}' was submitted. Admin will review and unlock the match link shortly.",
        "entry"
    )
    return doc


@api_router.get("/entries/mine")
async def my_entries(user=Depends(get_current_user)):
    items = await db.entries.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(500)
    ids = list({it["contest_id"] for it in items if it["status"] in ("approved", "won")})
    if ids:
        contests = await db.contests.find({"id": {"$in": ids}}, {"_id": 0, "id": 1, "external_link": 1}).to_list(len(ids))
        link_by_contest = {c["id"]: c.get("external_link") for c in contests}
        for it in items:
            if it["status"] in ("approved", "won"):
                it["external_link"] = link_by_contest.get(it["contest_id"])
    return items


@api_router.get("/entries")
async def all_entries(status: Optional[str] = None, admin=Depends(require_admin)):
    q = {}
    if status:
        q["status"] = status
    items = await db.entries.find(q, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return items


@api_router.post("/entries/{entry_id}/decision")
async def approve_entry(entry_id: str, body: ApproveBody, admin=Depends(require_admin)):
    entry = await db.entries.find_one({"id": entry_id})
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    if entry["status"] != "pending":
        raise HTTPException(status_code=400, detail=f"Entry already {entry['status']}")
    new_status = "approved" if body.action == "approve" else "rejected"
    await db.entries.update_one(
        {"id": entry_id},
        {"$set": {"status": new_status, "decision_note": body.note or "", "decided_at": now_iso()}},
    )

    # Send Notification to user
    if new_status == "approved":
        await notify_user(
            entry["user_id"],
            "Entry Approved! ✅",
            f"Your entry for '{entry['contest_title']}' has been approved! The match link is now unlocked.",
            "entry"
        )
    else:
        note_str = f" Reason: {body.note}" if body.note else ""
        await notify_user(
            entry["user_id"],
            "Entry Rejected ❌",
            f"Your payment proof for '{entry['contest_title']}' was rejected.{note_str}",
            "entry"
        )

    return {"ok": True, "status": new_status}


@api_router.post("/entries/{entry_id}/declare-winner")
async def declare_winner(entry_id: str, body: DeclareWinnerBody, admin=Depends(require_admin)):
    entry = await db.entries.find_one({"id": entry_id})
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    if entry["status"] != "approved":
        raise HTTPException(status_code=400, detail="Entry must be approved before declaring winner")
    if body.prize_amount <= 0:
        raise HTTPException(status_code=400, detail="Prize must be positive")

    await db.entries.update_one(
        {"id": entry_id},
        {"$set": {"status": "won", "winner_prize": body.prize_amount, "won_at": now_iso()}},
    )
    # Automatic Wallet Settlement: Credit to user wallet immediately
    await db.users.update_one(
        {"id": entry["user_id"]},
        {"$inc": {"wallet_balance": body.prize_amount, "winnings_balance": body.prize_amount}},
    )
    # Add wallet log
    await db.wallet_logs.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": entry["user_id"],
        "amount": body.prize_amount,
        "note": f"Prize won for '{entry['contest_title']}'",
        "type": "prize",
        "created_at": now_iso(),
    })
    # Notification to winner
    await notify_user(
        entry["user_id"],
        "🏆 YOU WON!",
        f"Congratulations! You won ₹{body.prize_amount} in '{entry['contest_title']}'! The prize has been credited to your wallet.",
        "winner"
    )

    # WhatsApp pre-filled link helper returned for admin convenience
    wa_msg = f"🏆 Congratulations {entry['user_name']}! You won ₹{body.prize_amount} in '{entry['contest_title']}' on PitchPlay! Your prize has been credited to your wallet. You can withdraw anytime! 🏏"
    wa_link = f"https://wa.me/{entry.get('user_mobile', '').replace('+', '').strip()}?text={requests.utils.quote(wa_msg)}"

    return {
        "ok": True,
        "whatsapp_link": wa_link,
        "message": f"Winner declared and ₹{body.prize_amount} credited to {entry['user_name']}'s wallet!"
    }


# ---------- Wallet & Withdrawals ----------
@api_router.get("/wallet/config")
async def wallet_config(user=Depends(get_current_user)):
    s = await get_payment_settings()
    return {
        "admin_upi_id": s["upi_id"],
        "payee_name": s.get("payee_name", ""),
        "instructions": s.get("instructions", ""),
        "qr_path": s.get("qr_path"),
        "razorpay_key_id": s.get("razorpay_key_id", ""),
        "razorpay_payment_link": s.get("razorpay_payment_link", ""),
    }


@api_router.post("/wallet/razorpay/create-order")
async def create_razorpay_order(body: RazorpayOrderCreate, user=Depends(get_current_user)):
    if user["role"] == "admin":
        raise HTTPException(status_code=400, detail="Admin cannot create deposit order")
    if body.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")

    settings = await get_payment_settings()
    key_id = settings.get("razorpay_key_id") or os.environ.get("RAZORPAY_KEY_ID", "rzp_test_pitchplay_demo")
    key_secret = settings.get("razorpay_key_secret") or os.environ.get("RAZORPAY_KEY_SECRET", "")
    payment_link = settings.get("razorpay_payment_link") or os.environ.get("RAZORPAY_PAYMENT_LINK", "")

    order_id = f"order_{uuid.uuid4().hex[:14]}"
    amount_paise = int(round(body.amount * 100))
    is_live_order = False

    if key_id and key_secret and not key_id.startswith("rzp_test_pitchplay"):
        try:
            r = requests.post(
                "https://api.razorpay.com/v1/orders",
                auth=(key_id, key_secret),
                json={
                    "amount": amount_paise,
                    "currency": "INR",
                    "receipt": f"rcpt_{uuid.uuid4().hex[:8]}",
                    "notes": {"user_id": user["id"], "user_mobile": user["mobile"]}
                },
                timeout=15
            )
            if r.status_code in (200, 201):
                order_data = r.json()
                order_id = order_data["id"]
                is_live_order = True
            else:
                logger.warning(f"Razorpay live order API returned {r.status_code}: {r.text}")
        except Exception as e:
            logger.warning(f"Razorpay live order API failed ({e}), using fallback order ID.")

    doc = {
        "id": str(uuid.uuid4()),
        "order_id": order_id,
        "user_id": user["id"],
        "user_name": user["name"],
        "user_mobile": user["mobile"],
        "amount": body.amount,
        "currency": "INR",
        "gateway": "razorpay",
        "status": "pending",
        "is_live_order": is_live_order,
        "created_at": now_iso(),
    }
    await db.deposit_orders.insert_one(doc)

    return {
        "order_id": order_id,
        "amount": body.amount,
        "amount_paise": amount_paise,
        "currency": "INR",
        "key_id": key_id,
        "is_live_order": is_live_order,
        "payment_link": payment_link,
        "user_name": user["name"],
        "user_mobile": user["mobile"],
    }


@api_router.post("/wallet/razorpay/verify")
async def verify_razorpay_payment(body: RazorpayVerifyBody, user=Depends(get_current_user)):
    settings = await get_payment_settings()
    key_id = settings.get("razorpay_key_id") or os.environ.get("RAZORPAY_KEY_ID", "")
    key_secret = settings.get("razorpay_key_secret") or os.environ.get("RAZORPAY_KEY_SECRET", "")

    order = await db.deposit_orders.find_one({"order_id": body.razorpay_order_id, "user_id": user["id"]})
    amount = body.amount
    if order:
        amount = float(order.get("amount", body.amount))
        if order.get("status") == "completed":
            u = await db.users.find_one({"id": user["id"]}, {"_id": 0})
            dep_bal, win_bal, tot_bal = get_user_balances(u)
            return {
                "ok": True,
                "already_credited": True,
                "wallet_balance": tot_bal,
                "deposit_balance": dep_bal,
                "winnings_balance": win_bal,
            }

    # Live verification if Razorpay secret is present and not mock key
    if key_secret and not key_id.startswith("rzp_test_pitchplay"):
        verified = False

        # 1. Check HMAC signature if razorpay_signature provided
        if body.razorpay_signature and body.razorpay_signature != "rzp_verified":
            if verify_razorpay_signature(body.razorpay_order_id, body.razorpay_payment_id, body.razorpay_signature, key_secret):
                verified = True

        # 2. Query Razorpay REST API directly to verify payment status and amount
        if not verified and key_id and body.razorpay_payment_id and not body.razorpay_payment_id.startswith("pay_demo_"):
            try:
                r = requests.get(
                    f"https://api.razorpay.com/v1/payments/{body.razorpay_payment_id}",
                    auth=(key_id, key_secret),
                    timeout=10
                )
                if r.status_code == 200:
                    pdata = r.json()
                    status = pdata.get("status")
                    paid_amt = pdata.get("amount", 0) / 100.0
                    # Auto-capture if payment is authorized but not yet captured
                    if status == "authorized":
                        cap_r = requests.post(
                            f"https://api.razorpay.com/v1/payments/{body.razorpay_payment_id}/capture",
                            auth=(key_id, key_secret),
                            json={"amount": pdata.get("amount"), "currency": "INR"},
                            timeout=10
                        )
                        if cap_r.status_code == 200:
                            status = "captured"
                    if status == "captured" and abs(paid_amt - amount) < 0.01:
                        verified = True
            except Exception as e:
                logger.warning(f"Error querying Razorpay API for verification: {e}")

        # If live credentials exist and verification failed and not simulation
        if not verified and body.razorpay_signature != "rzp_verified":
            raise HTTPException(
                status_code=400,
                detail="Razorpay payment verification failed: Invalid signature or payment not captured"
            )

    await db.deposit_orders.update_one(
        {"order_id": body.razorpay_order_id},
        {"$set": {
            "status": "completed",
            "razorpay_payment_id": body.razorpay_payment_id,
            "razorpay_signature": body.razorpay_signature or "",
            "verified_at": now_iso()
        }},
        upsert=True
    )

    await db.users.update_one(
        {"id": user["id"]},
        {"$inc": {"wallet_balance": amount, "deposit_balance": amount}}
    )

    await db.wallet_logs.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "amount": amount,
        "note": f"Razorpay Payment ({body.razorpay_payment_id})",
        "type": "credit",
        "created_at": now_iso(),
    })

    await notify_user(
        user["id"],
        "💰 Razorpay Deposit Successful!",
        f"₹{amount} credited to your wallet via Razorpay (ID: {body.razorpay_payment_id}).",
        "withdrawal"
    )

    u = await db.users.find_one({"id": user["id"]}, {"_id": 0})
    dep_bal, win_bal, tot_bal = get_user_balances(u)
    return {
        "ok": True,
        "payment_id": body.razorpay_payment_id,
        "credited_amount": amount,
        "wallet_balance": tot_bal,
        "deposit_balance": dep_bal,
        "winnings_balance": win_bal,
        "message": f"₹{amount} successfully credited via Razorpay!"
    }



@api_router.post("/wallet/deposit/create")
async def create_deposit_order(body: DepositCreateBody, user=Depends(get_current_user)):
    if user["role"] == "admin":
        raise HTTPException(status_code=400, detail="Admin cannot deposit into personal wallet")
    if body.amount <= 0:
        raise HTTPException(status_code=400, detail="Deposit amount must be positive")

    settings = await get_payment_settings()
    admin_upi = settings.get("upi_id") or ADMIN_UPI_ID
    payee_name = settings.get("payee_name") or "PitchPlay"

    order_id = f"DEP-{uuid.uuid4().hex[:8].upper()}"

    # Build UPI intent URIs
    upi_uri = (
        f"upi://pay?pa={requests.utils.quote(admin_upi)}"
        f"&pn={requests.utils.quote(payee_name)}"
        f"&am={body.amount:.2f}"
        f"&tr={order_id}"
        f"&tn={requests.utils.quote(f'Deposit {order_id}')}"
        f"&cu=INR"
    )
    gpay_uri = (
        f"tez://upi/pay?pa={requests.utils.quote(admin_upi)}"
        f"&pn={requests.utils.quote(payee_name)}"
        f"&am={body.amount:.2f}"
        f"&tr={order_id}"
        f"&tn={requests.utils.quote(f'Deposit {order_id}')}"
        f"&cu=INR"
    )
    phonepe_uri = (
        f"phonepe://pay?pa={requests.utils.quote(admin_upi)}"
        f"&pn={requests.utils.quote(payee_name)}"
        f"&am={body.amount:.2f}"
        f"&tr={order_id}"
        f"&tn={requests.utils.quote(f'Deposit {order_id}')}"
        f"&cu=INR"
    )
    paytm_uri = (
        f"paytmmp://pay?pa={requests.utils.quote(admin_upi)}"
        f"&pn={requests.utils.quote(payee_name)}"
        f"&am={body.amount:.2f}"
        f"&tr={order_id}"
        f"&tn={requests.utils.quote(f'Deposit {order_id}')}"
        f"&cu=INR"
    )

    order_doc = {
        "id": str(uuid.uuid4()),
        "order_id": order_id,
        "user_id": user["id"],
        "user_name": user["name"],
        "user_mobile": user["mobile"],
        "amount": body.amount,
        "status": "pending",
        "upi_app": body.upi_app or "generic",
        "created_at": now_iso(),
    }
    await db.deposit_orders.insert_one(order_doc)

    return {
        "order_id": order_id,
        "amount": body.amount,
        "admin_upi": admin_upi,
        "payee_name": payee_name,
        "upi_uri": upi_uri,
        "gpay_uri": gpay_uri,
        "phonepe_uri": phonepe_uri,
        "paytm_uri": paytm_uri,
        "created_at": order_doc["created_at"],
    }


@api_router.post("/wallet/deposit/verify")
async def verify_deposit_order(body: DepositVerifyBody, user=Depends(get_current_user)):
    order = await db.deposit_orders.find_one({"order_id": body.order_id, "user_id": user["id"]})
    if not order:
        raise HTTPException(status_code=404, detail="Deposit order not found")

    if order.get("status") == "completed":
        u = await db.users.find_one({"id": user["id"]}, {"_id": 0})
        dep_bal, win_bal, tot_bal = get_user_balances(u)
        return {
            "ok": True,
            "already_credited": True,
            "wallet_balance": tot_bal,
            "deposit_balance": dep_bal,
            "winnings_balance": win_bal,
        }

    amount = float(order["amount"])
    # Mark order as completed
    await db.deposit_orders.update_one(
        {"order_id": body.order_id},
        {"$set": {"status": "completed", "utr": body.utr or "", "verified_at": now_iso()}}
    )
    # Credit to user deposit balance and wallet balance
    await db.users.update_one(
        {"id": user["id"]},
        {"$inc": {"wallet_balance": amount, "deposit_balance": amount}}
    )
    # Insert wallet log
    await db.wallet_logs.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "amount": amount,
        "note": f"UPI Instant Deposit ({body.order_id})",
        "type": "credit",
        "created_at": now_iso(),
    })
    # Send in-app notification
    await notify_user(
        user["id"],
        "💰 Cash Added Successfully!",
        f"₹{amount} has been instantly credited to your wallet via UPI ({body.order_id}).",
        "withdrawal"
    )
    u = await db.users.find_one({"id": user["id"]}, {"_id": 0})
    dep_bal, win_bal, tot_bal = get_user_balances(u)
    return {
        "ok": True,
        "order_id": body.order_id,
        "credited_amount": amount,
        "wallet_balance": tot_bal,
        "deposit_balance": dep_bal,
        "winnings_balance": win_bal,
        "message": f"₹{amount} added to your wallet successfully!"
    }


@api_router.post("/entries/wallet-join")
async def wallet_join_contest(body: WalletJoinBody, user=Depends(get_current_user)):
    if user["role"] == "admin":
        raise HTTPException(status_code=400, detail="Admin cannot join contests")

    contest = await db.contests.find_one({"id": body.contest_id}, {"_id": 0})
    if not contest:
        raise HTTPException(status_code=404, detail="Contest not found")
    if contest.get("status") != "open":
        raise HTTPException(status_code=400, detail="Contest is not currently open for entries")

    mt = contest.get("match_time")
    if mt:
        try:
            if datetime.fromisoformat(mt.replace("Z", "+00:00")) <= datetime.now(timezone.utc):
                raise HTTPException(status_code=400, detail="Entries closed: match already started")
        except ValueError:
            pass

    existing = await db.entries.find_one(
        {"contest_id": body.contest_id, "user_id": user["id"], "status": {"$in": ["pending", "approved", "won"]}}
    )
    if existing:
        raise HTTPException(status_code=400, detail="You already joined this contest")

    entry_fee = float(contest.get("entry_fee", 0.0))
    current_user = await db.users.find_one({"id": user["id"]}, {"_id": 0})
    dep_bal, win_bal, tot_bal = get_user_balances(current_user)

    if tot_bal < entry_fee:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient wallet balance. Required ₹{entry_fee}, available ₹{tot_bal}."
        )

    # Fair split deduction: first exhaust deposit_balance (unutilized cash), then remainder from winnings_balance
    from_deposit = min(dep_bal, entry_fee)
    from_winnings = round(entry_fee - from_deposit, 2)

    await db.users.update_one(
        {"id": user["id"]},
        {
            "$inc": {
                "wallet_balance": -entry_fee,
                "deposit_balance": -from_deposit,
                "winnings_balance": -from_winnings,
            }
        }
    )

    # Log deduction
    await db.wallet_logs.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "amount": -entry_fee,
        "note": f"Joined contest '{contest['title']}'",
        "type": "debit",
        "created_at": now_iso(),
    })

    # Create approved entry immediately!
    entry_id = str(uuid.uuid4())
    doc = {
        "id": entry_id,
        "contest_id": body.contest_id,
        "contest_title": contest["title"],
        "user_id": user["id"],
        "user_name": user["name"],
        "user_mobile": user["mobile"],
        "entry_fee": entry_fee,
        "utr": "WALLET_BALANCE",
        "screenshot_path": "wallet_payment",
        "screenshot_paths": ["wallet_payment"],
        "payment_mode": "wallet",
        "status": "approved",
        "external_link": contest.get("external_link"),
        "winner_prize": 0.0,
        "created_at": now_iso(),
    }
    await db.entries.insert_one(doc)
    doc.pop("_id", None)

    # Notification
    await notify_user(
        user["id"],
        "Contest Joined Instantly! 🎟️",
        f"You joined '{contest['title']}' using wallet balance! The match link is unlocked.",
        "entry"
    )

    updated_user = await db.users.find_one({"id": user["id"]}, {"_id": 0})
    dep_bal, win_bal, tot_bal = get_user_balances(updated_user)
    return {
        "ok": True,
        "entry": doc,
        "wallet_balance": tot_bal,
        "deposit_balance": dep_bal,
        "winnings_balance": win_bal,
        "message": f"Successfully joined {contest['title']}!"
    }



@api_router.get("/wallet/history")
async def wallet_history(user=Depends(get_current_user)):
    items = []
    async for e in db.entries.find({"user_id": user["id"], "status": "won"}, {"_id": 0}):
        items.append({
            "id": e["id"],
            "type": "prize",
            "amount": e.get("winner_prize", 0),
            "note": f"Won {e['contest_title']}",
            "created_at": e.get("won_at") or e["created_at"]
        })
    async for w in db.withdrawals.find({"user_id": user["id"]}, {"_id": 0}):
        items.append({
            "id": w["id"],
            "type": "payout",
            "amount": -w["amount"],
            "note": f"Withdrawal to {w['upi_id']} ({w['status']})",
            "created_at": w["created_at"]
        })
    async for l in db.wallet_logs.find({"user_id": user["id"]}, {"_id": 0}):
        items.append({
            "id": l["id"],
            "type": l.get("type", "credit" if l["amount"] > 0 else "debit"),
            "amount": l["amount"],
            "note": l.get("note") or "Wallet adjustment",
            "created_at": l["created_at"]
        })
    items.sort(key=lambda x: x["created_at"], reverse=True)
    return items


@api_router.get("/winners")
async def winners_board(user=Depends(get_current_user)):
    items = await db.entries.find(
        {"status": "won"},
        {"_id": 0, "id": 1, "contest_title": 1, "user_name": 1, "winner_prize": 1, "won_at": 1}
    ).sort("won_at", -1).to_list(100)
    return items


@api_router.post("/withdrawals")
async def create_withdrawal(body: WithdrawalCreate, user=Depends(get_current_user)):
    if user["role"] == "admin":
        raise HTTPException(status_code=400, detail="Admin cannot request withdrawal")
    
    amount = float(body.amount)
    if amount < 50.0:
        raise HTTPException(status_code=400, detail="Minimum withdrawal amount is ₹50")
    if amount > 50000.0:
        raise HTTPException(status_code=400, detail="Maximum withdrawal amount is ₹50,000 per request")

    # Limit: max 3 requests per 24 hours
    day_ago = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
    recent_count = await db.withdrawals.count_documents({
        "user_id": user["id"],
        "created_at": {"$gte": day_ago}
    })
    if recent_count >= 3:
        raise HTTPException(
            status_code=400,
            detail="Daily withdrawal limit reached (Maximum 3 payout requests per 24 hours). Please try again tomorrow."
        )

    curr_user = await db.users.find_one({"id": user["id"]}, {"_id": 0})
    dep_bal, win_bal, tot_bal = get_user_balances(curr_user)

    if amount > win_bal:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient withdrawable winnings balance. Your winnings balance is ₹{win_bal:.2f}. (Unutilized deposit cash ₹{dep_bal:.2f} cannot be withdrawn directly and is used for joining matches)."
        )

    # Deduct amount from user's winnings_balance and wallet_balance
    await db.users.update_one(
        {"id": user["id"]},
        {"$inc": {"wallet_balance": -amount, "winnings_balance": -amount}}
    )

    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "user_name": user["name"],
        "user_mobile": user["mobile"],
        "amount": amount,
        "upi_id": body.upi_id.strip(),
        "status": "pending",
        "created_at": now_iso(),
    }
    await db.withdrawals.insert_one(doc)
    doc.pop("_id", None)

    # Log in wallet_logs
    await db.wallet_logs.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "amount": -amount,
        "note": f"Payout request to UPI '{body.upi_id.strip()}'",
        "type": "payout",
        "created_at": now_iso(),
    })

    await notify_user(
        user["id"],
        "Withdrawal Requested 💸",
        f"Payout request for ₹{amount} to UPI '{body.upi_id.strip()}' submitted. Admin will process shortly.",
        "withdrawal"
    )
    return doc


@api_router.get("/withdrawals/mine")
async def my_withdrawals(user=Depends(get_current_user)):
    items = await db.withdrawals.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return items


@api_router.get("/withdrawals")
async def list_withdrawals(status: Optional[str] = None, admin=Depends(require_admin)):
    q = {}
    if status:
        q["status"] = status
    items = await db.withdrawals.find(q, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return items


@api_router.post("/withdrawals/{wid}/decision")
async def decide_withdrawal(wid: str, body: ApproveBody, admin=Depends(require_admin)):
    w = await db.withdrawals.find_one({"id": wid})
    if not w:
        raise HTTPException(status_code=404, detail="Withdrawal not found")
    if w["status"] != "pending":
        raise HTTPException(status_code=400, detail=f"Already {w['status']}")

    if body.action == "approve":
        utr_val = (body.utr or "").strip()
        await db.withdrawals.update_one(
            {"id": wid},
            {"$set": {
                "status": "paid",
                "utr": utr_val,
                "decision_note": body.note or "",
                "decided_at": now_iso()
            }},
        )
        msg_suffix = f" (UTR / Ref: {utr_val})" if utr_val else ""
        await notify_user(
            w["user_id"],
            "Withdrawal Paid! 💰",
            f"Your payout of ₹{w['amount']} to UPI ID {w['upi_id']} has been transferred by admin{msg_suffix}.",
            "withdrawal"
        )
    else:
        # refund balance to winnings_balance and wallet_balance
        await db.users.update_one(
            {"id": w["user_id"]},
            {"$inc": {"wallet_balance": w["amount"], "winnings_balance": w["amount"]}}
        )
        await db.withdrawals.update_one(
            {"id": wid},
            {"$set": {"status": "rejected", "decision_note": body.note or "", "decided_at": now_iso()}},
        )
        # Add refund entry to wallet_logs
        await db.wallet_logs.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": w["user_id"],
            "amount": w["amount"],
            "note": f"Refund for rejected withdrawal ({body.note or 'Invalid UPI ID'})",
            "type": "credit",
            "created_at": now_iso(),
        })
        await notify_user(
            w["user_id"],
            "Withdrawal Rejected & Refunded 🔄",
            f"Your payout request of ₹{w['amount']} was rejected ({body.note or 'Invalid UPI'}). The funds have been refunded to your winnings balance.",
            "withdrawal"
        )
    return {"ok": True}


# ---------- Admin: Users & Settings ----------
@api_router.get("/admin/payment-settings")
async def admin_get_payment_settings(admin=Depends(require_admin)):
    return await get_payment_settings()


@api_router.put("/admin/payment-settings")
async def admin_put_payment_settings(body: PaymentSettingsBody, admin=Depends(require_admin)):
    doc = {
        "key": "payment",
        "upi_id": body.upi_id.strip(),
        "payee_name": body.payee_name.strip(),
        "instructions": body.instructions.strip(),
        "razorpay_key_id": (body.razorpay_key_id or "").strip(),
        "razorpay_key_secret": (body.razorpay_key_secret or "").strip(),
        "razorpay_payment_link": (body.razorpay_payment_link or "").strip(),
        "updated_at": now_iso()
    }
    await db.settings.update_one({"key": "payment"}, {"$set": doc}, upsert=True)
    return await get_payment_settings()


@api_router.post("/admin/payment-settings/test-razorpay")
async def admin_test_razorpay(body: RazorpayTestBody, admin=Depends(require_admin)):
    key_id = body.key_id.strip()
    key_secret = body.key_secret.strip()
    if not key_id or not key_secret:
        raise HTTPException(status_code=400, detail="Both Razorpay Key ID and Key Secret are required")
    try:
        r = requests.get(
            "https://api.razorpay.com/v1/payments?count=1",
            auth=(key_id, key_secret),
            timeout=10
        )
        if r.status_code == 200:
            mode = "Live Mode" if key_id.startswith("rzp_live") else "Test Mode"
            return {
                "ok": True,
                "mode": mode,
                "message": f"Successfully connected to Razorpay ({mode})! API credentials are valid."
            }
        else:
            err_msg = "Invalid Razorpay Key ID or Key Secret"
            try:
                err_data = r.json()
                if "error" in err_data and "description" in err_data["error"]:
                    err_msg = err_data["error"]["description"]
            except Exception:
                pass
            raise HTTPException(status_code=400, detail=f"Razorpay connection failed: {err_msg}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Network error testing Razorpay: {str(e)}")


@api_router.post("/admin/payment-settings/qr")
async def admin_upload_qr(qr: UploadFile = File(...), admin=Depends(require_admin)):
    data = await qr.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty file")
    ext = (qr.filename or "png").rsplit(".", 1)[-1].lower()
    path = f"{APP_NAME}/qr/{uuid.uuid4()}.{ext}"
    result = save_file_data(path, data, qr.content_type or "image/png")
    await db.settings.update_one({"key": "payment"}, {"$set": {"qr_path": result["path"], "updated_at": now_iso()}}, upsert=True)
    return await get_payment_settings()


@api_router.delete("/admin/payment-settings/qr")
async def admin_remove_qr(admin=Depends(require_admin)):
    await db.settings.update_one({"key": "payment"}, {"$unset": {"qr_path": ""}})
    return await get_payment_settings()


@api_router.get("/admin/users")
async def admin_users(admin=Depends(require_admin)):
    pipeline = [
        {"$match": {"role": "user"}},
        {"$sort": {"created_at": -1}},
        {"$lookup": {
            "from": "entries",
            "localField": "id",
            "foreignField": "user_id",
            "as": "entries",
        }},
        {"$addFields": {
            "entries_count": {"$size": "$entries"},
            "total_won": {"$sum": {"$map": {
                "input": {"$filter": {"input": "$entries", "as": "e", "cond": {"$eq": ["$$e.status", "won"]}}},
                "as": "e",
                "in": {"$ifNull": ["$$e.winner_prize", 0]},
            }}},
        }},
        {"$project": {"_id": 0, "password_hash": 0, "entries": 0}},
    ]
    users = await db.users.aggregate(pipeline).to_list(1000)
    for u in users:
        dep, win, tot = get_user_balances(u)
        u["deposit_balance"] = dep
        u["winnings_balance"] = win
        u["wallet_balance"] = tot
    return users


@api_router.post("/admin/users")
async def admin_create_user(body: AdminUserCreate, admin=Depends(require_admin)):
    mobile = body.mobile.strip()
    if await db.users.find_one({"mobile": mobile}):
        raise HTTPException(status_code=400, detail="Mobile already registered")
    initial_balance = float(body.wallet_balance)
    doc = {
        "id": str(uuid.uuid4()),
        "name": body.name.strip(),
        "mobile": mobile,
        "password_hash": hash_password(body.password),
        "role": "user",
        "wallet_balance": initial_balance,
        "deposit_balance": initial_balance,
        "winnings_balance": 0.0,
        "referral_code": generate_referral_code(),
        "blocked": False,
        "created_by_admin": True,
        "created_at": now_iso(),
    }
    await db.users.insert_one(doc)
    doc.pop("_id", None)
    doc.pop("password_hash", None)
    return doc


@api_router.delete("/admin/users/{user_id}")
async def admin_delete_user(user_id: str, admin=Depends(require_admin)):
    u = await db.users.find_one({"id": user_id, "role": "user"})
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    await db.users.delete_one({"id": user_id})
    await db.entries.delete_many({"user_id": user_id})
    await db.withdrawals.delete_many({"user_id": user_id})
    return {"ok": True}


@api_router.post("/admin/users/{user_id}/block")
async def admin_block_user(user_id: str, body: BlockBody, admin=Depends(require_admin)):
    res = await db.users.update_one({"id": user_id, "role": "user"}, {"$set": {"blocked": body.blocked}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"ok": True, "blocked": body.blocked}


@api_router.post("/admin/users/{user_id}/wallet")
async def admin_adjust_wallet(user_id: str, body: WalletAdjustBody, admin=Depends(require_admin)):
    u = await db.users.find_one({"id": user_id, "role": "user"}, {"_id": 0})
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    if body.amount == 0:
        raise HTTPException(status_code=400, detail="Amount cannot be zero")
    dep_bal, win_bal, tot_bal = get_user_balances(u)
    new_balance = tot_bal + body.amount
    if new_balance < 0:
        raise HTTPException(status_code=400, detail="Balance cannot go negative")

    if body.amount > 0:
        new_dep = dep_bal + body.amount
        new_win = win_bal
    else:
        deduct = abs(body.amount)
        from_dep = min(dep_bal, deduct)
        from_win = deduct - from_dep
        new_dep = max(0.0, dep_bal - from_dep)
        new_win = max(0.0, win_bal - from_win)

    await db.users.update_one(
        {"id": user_id},
        {"$set": {
            "wallet_balance": round(new_balance, 2),
            "deposit_balance": round(new_dep, 2),
            "winnings_balance": round(new_win, 2),
        }}
    )
    await db.wallet_logs.insert_one({
        "id": str(uuid.uuid4()), "user_id": user_id, "amount": body.amount,
        "note": body.note or "Admin adjustment", "type": "credit" if body.amount > 0 else "debit",
        "by": admin["id"], "created_at": now_iso(),
    })
    return {
        "ok": True,
        "wallet_balance": round(new_balance, 2),
        "deposit_balance": round(new_dep, 2),
        "winnings_balance": round(new_win, 2),
    }


@api_router.get("/admin/stats")
async def admin_stats(admin=Depends(require_admin)):
    total_users = await db.users.count_documents({"role": "user"})
    total_contests = await db.contests.count_documents({})
    pending_entries = await db.entries.count_documents({"status": "pending"})
    pending_withdrawals = await db.withdrawals.count_documents({"status": "pending"})
    return {
        "total_users": total_users,
        "total_contests": total_contests,
        "pending_entries": pending_entries,
        "pending_withdrawals": pending_withdrawals,
    }


# ---------- Files Endpoint ----------
@api_router.get("/files")
async def serve_file(path: str = Query(...), user=Depends(get_current_user)):
    try:
        data, content_type = get_file_data(path)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"File not found: {e}")
    return Response(content=data, media_type=content_type)


# ---------- Background Scheduler Task ----------
async def contest_scheduler_loop():
    """Background task running every 30 seconds to auto-open/close scheduled contests"""
    while True:
        try:
            now = datetime.now(timezone.utc)
            # Auto-open upcoming contests
            async for c in db.contests.find({"status": "upcoming"}):
                if c.get("scheduled_open_time"):
                    try:
                        open_dt = datetime.fromisoformat(c["scheduled_open_time"].replace("Z", "+00:00"))
                        if open_dt <= now:
                            await db.contests.update_one({"id": c["id"]}, {"$set": {"status": "open"}})
                            logger.info(f"Auto-opened contest: {c['title']}")
                    except Exception:
                        pass

            # Auto-close open contests when scheduled_close_time or match_time reached
            async for c in db.contests.find({"status": "open"}):
                close_time = c.get("scheduled_close_time") or c.get("match_time")
                if close_time:
                    try:
                        close_dt = datetime.fromisoformat(close_time.replace("Z", "+00:00"))
                        if close_dt <= now:
                            await db.contests.update_one({"id": c["id"]}, {"$set": {"status": "closed"}})
                            logger.info(f"Auto-closed contest: {c['title']}")
                    except Exception:
                        pass
        except Exception as e:
            logger.warning(f"Error in scheduler loop: {e}")
        await asyncio.sleep(30)


# ---------- Startup & Lifespan ----------
@app.on_event("startup")
async def startup():
    if db is None:
        logger.warning(
            "Skipping startup DB checks: no MongoDB connection is configured. "
            "Set MONGO_URL (or attach a MongoDB service) to enable database features."
        )
        return

    try:
        # Verify the connection is actually reachable before proceeding.
        await client.admin.command("ping")
    except Exception as e:
        logger.warning(f"Could not connect to MongoDB at startup ({e}). "
                        "Database-dependent features may be unavailable.")
        return

    # Seed admin
    admin = await db.users.find_one({"mobile": ADMIN_MOBILE})
    if not admin:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "name": "Admin",
            "mobile": ADMIN_MOBILE,
            "password_hash": hash_password(ADMIN_PASSWORD),
            "role": "admin",
            "wallet_balance": 0.0,
            "referral_code": "ADMIN",
            "created_at": now_iso(),
        })
        logger.info("Admin user seeded successfully")
    else:
        await db.users.update_one({"mobile": ADMIN_MOBILE}, {"$set": {"role": "admin"}})

    # Start contest scheduler in background
    asyncio.create_task(contest_scheduler_loop())
    logger.info("PitchPlay Contest Scheduler background task started")


@app.on_event("shutdown")
async def shutdown_db_client():
    if client is not None:
        client.close()


app.include_router(api_router)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

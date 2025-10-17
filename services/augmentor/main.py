# services/augmentor/main.py

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
import requests
import base64
import random
import numpy as np
import cv2
import albumentations as A
import uvicorn

app = FastAPI(title="MILES Augmentor", version="0.2.0")


# ---------- Payload ----------

class JobPayload(BaseModel):
    srcUrl: str = Field(..., description="HTTP-accessible image URL (e.g., Lighthouse gateway URL)")
    recipe: str = Field("weather_basic", description="Augmentation recipe name")
    count: int = Field(10, ge=1, le=12, description="How many variants to generate (1–12)")
    seed: int | None = Field(None, description="Optional RNG seed for reproducible results")


# ---------- Utils ----------

def fetch_image(url: str) -> np.ndarray:
    try:
        r = requests.get(url, timeout=30)
    except requests.RequestException as e:
        raise HTTPException(400, f"fetch failed: {e}")
    if r.status_code != 200:
        raise HTTPException(400, f"fetch failed {r.status_code}")
    arr = np.frombuffer(r.content, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise HTTPException(400, "invalid image data")
    return img


def resize_max(img: np.ndarray, max_side: int = 1600) -> np.ndarray:
    h, w = img.shape[:2]
    s = max(h, w)
    if s <= max_side:
        return img
    scale = max_side / s
    new_w, new_h = int(w * scale), int(h * scale)
    return cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)


def to_data_url_jpeg(img: np.ndarray, quality: int = 90) -> str:
    ok, buf = cv2.imencode(".jpg", img, [int(cv2.IMWRITE_JPEG_QUALITY), int(quality)])
    if not ok:
        raise HTTPException(500, "jpeg encode failed")
    b64 = base64.b64encode(buf.tobytes()).decode("utf-8")
    return f"data:image/jpeg;base64,{b64}"


def odd_in_range(n: float, lo: int = 3, hi: int = 11) -> int:
    """Clamp n to [lo, hi] and ensure it is odd."""
    k = max(lo, min(hi, int(round(n))))
    if k % 2 == 0:
        k = k + 1 if k + 1 <= hi else k - 1
    return k


def is_too_blurry(img: np.ndarray, thr: float = 60.0) -> bool:
    """Variance of Laplacian as blur metric."""
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    fm = cv2.Laplacian(gray, cv2.CV_64F).var()
    return fm < thr


def is_too_dark(img: np.ndarray, thr: float = 18.0) -> bool:
    """Average V in HSV space."""
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    v = hsv[..., 2].mean()
    return v < thr


# ---------- Recipes ----------

def build_weather_pipeline(strength: float = 1.0) -> A.Compose:
    """
    strength ~ [0.6, 1.4] for a sweep from subtle to heavy.
    """
    strength = max(0.4, min(1.6, strength))
    br = min(0.5, 0.18 * strength + 0.12)       # brightness range
    contrast = 0.18 * strength
    fog_low, fog_up = 0.12 * strength, 0.35 * strength
    rain_len = int(8 + 7 * strength)
    sun_radius = int(60 + 50 * strength)
    motion_k = odd_in_range(5 * strength, 3, 11)  # must be odd for MotionBlur

    return A.Compose([
        A.RandomBrightnessContrast(p=1.0, brightness_limit=br, contrast_limit=contrast),
        A.MotionBlur(blur_limit=motion_k, p=0.5),
        A.RandomRain(p=0.6, blur_value=3, drop_length=rain_len, drop_width=1,
                     brightness_coefficient=max(0.82, 1 - 0.10 * strength)),
        A.RandomFog(p=0.45, fog_coef_lower=fog_low, fog_coef_upper=fog_up, alpha_coef=0.08 * strength),
        A.RandomShadow(p=0.45),
        A.RandomSunFlare(p=0.4, flare_roi=(0, 0, 1, 0.5), angle_lower=0.5, src_radius=sun_radius),
    ])


def build_rain_heavy() -> A.Compose:
    return A.Compose([
        A.RandomBrightnessContrast(p=1.0, brightness_limit=0.25, contrast_limit=0.2),
        A.MotionBlur(blur_limit=9, p=0.6),  # odd
        A.RandomRain(p=1.0, blur_value=4, drop_length=16, drop_width=2, brightness_coefficient=0.88),
        A.RandomFog(p=0.25, fog_coef_lower=0.15, fog_coef_upper=0.28, alpha_coef=0.08),
        A.RandomShadow(p=0.4),
    ])


def build_fog_heavy() -> A.Compose:
    return A.Compose([
        A.RandomBrightnessContrast(p=1.0, brightness_limit=0.18, contrast_limit=0.15),
        A.RandomFog(p=1.0, fog_coef_lower=0.25, fog_coef_upper=0.45, alpha_coef=0.10),
        A.MotionBlur(blur_limit=7, p=0.4),  # odd
        A.RandomShadow(p=0.35),
    ])


def build_night_glare() -> A.Compose:
    return A.Compose([
        A.RandomBrightnessContrast(p=1.0, brightness_limit=(-0.25, 0.05), contrast_limit=0.2),
        A.RandomSunFlare(p=0.8, flare_roi=(0, 0, 1, 0.6), angle_lower=0.4, src_radius=90),
        A.MotionBlur(blur_limit=5, p=0.4),  # odd
        A.RandomShadow(p=0.4),
        A.Downscale(scale_min=0.8, scale_max=0.95, p=0.3),
    ])


RECIPE_BUILDERS = {
    "weather_basic": build_weather_pipeline,  # expects a strength value
    "rain_heavy": lambda: build_rain_heavy(),
    "fog_heavy": lambda: build_fog_heavy(),
    "night_glare": lambda: build_night_glare(),
}


# ---------- Routes ----------

@app.post("/augment")
def augment(payload: JobPayload):
    # RNG for reproducibility
    rng = random.Random(payload.seed or 0)
    np.random.seed((payload.seed or 0) % (2**32 - 1))

    # Fetch + resize
    img = fetch_image(payload.srcUrl)
    img = resize_max(img, 1600)

    n = max(1, min(12, payload.count))
    outputs: list[str] = []

    if payload.recipe == "weather_basic":
        # Sweep strengths from ~0.6 to ~1.4, with slight jitter from the seed.
        for i in range(n):
            base = 0.6 + 0.8 * (i / max(1, n - 1))
            strength = max(0.5, min(1.5, base + (rng.random() - 0.5) * 0.15))
            aug = build_weather_pipeline(strength)

            var = aug(image=img)["image"]
            # quick quality guard: retry once if trash
            attempts = 0
            while attempts < 1 and (is_too_blurry(var) or is_too_dark(var)):
                var = aug(image=img)["image"]
                attempts += 1

            outputs.append(to_data_url_jpeg(var, quality=90))
    else:
        builder = RECIPE_BUILDERS.get(payload.recipe)
        if builder is None:
            raise HTTPException(400, f"unknown recipe '{payload.recipe}'")

        for _ in range(n):
            aug = builder()
            var = aug(image=img)["image"]
            attempts = 0
            while attempts < 1 and (is_too_blurry(var) or is_too_dark(var)):
                var = aug(image=img)["image"]
                attempts += 1
            outputs.append(to_data_url_jpeg(var, quality=90))

    return {"outputsBase64": outputs}


@app.get("/health")
def health():
    return {"ok": True}


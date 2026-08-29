from pathlib import Path
from datetime import timedelta
import os
import stripe

BASE_DIR = Path(__file__).resolve().parent.parent


# ── Environment ───────────────────────────────────────────────────────────────

def get_env(key, default=None):
    return os.environ.get(key, default)


# Try django-environ if available
try:
    import environ

    env = environ.Env()
    env_file = BASE_DIR / ".env"

    if env_file.exists():
        environ.Env.read_env(str(env_file))

except ImportError:
    pass


# ── Core Settings ─────────────────────────────────────────────────────────────

SECRET_KEY = get_env(
    "SECRET_KEY",
    "dev-secret-key-change-in-production",
)

DEBUG = get_env("DEBUG", "True") == "True"

ALLOWED_HOSTS = ["*"]

AUTH_USER_MODEL = "accounts.User"


# ── Installed Apps ────────────────────────────────────────────────────────────

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    # Cloudinary
    "cloudinary_storage",
    "cloudinary",

    # REST API
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",

    # CORS / Filters / Storage
    "corsheaders",
    "django_filters",
    "storages",

    # Project apps
    "apps.accounts",
    "apps.products",
    "apps.orders",
    "apps.payments",
    "apps.notifications",
]


# ── Middleware ────────────────────────────────────────────────────────────────

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]


# ── URLs / WSGI ──────────────────────────────────────────────────────────────

ROOT_URLCONF = "config.urls"

WSGI_APPLICATION = "config.wsgi.application"


# ── Templates ─────────────────────────────────────────────────────────────────

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]


# ── Database ──────────────────────────────────────────────────────────────────

DATABASE_URL = get_env("DATABASE_URL", "")

if DATABASE_URL and DATABASE_URL.startswith("postgres"):
    import urllib.parse

    url = urllib.parse.urlparse(DATABASE_URL)

    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": url.path[1:],
            "USER": url.username,
            "PASSWORD": url.password,
            "HOST": url.hostname,
            "PORT": url.port or 5432,
        }
    }

else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }


# ── Cache / Redis ─────────────────────────────────────────────────────────────

REDIS_URL = get_env("REDIS_URL", "")

if REDIS_URL:
    CACHES = {
        "default": {
            "BACKEND": "django_redis.cache.RedisCache",
            "LOCATION": REDIS_URL,
            "OPTIONS": {
                "CLIENT_CLASS": "django_redis.client.DefaultClient",
            },
            "KEY_PREFIX": "jumia",
        }
    }

    SESSION_ENGINE = "django.contrib.sessions.backends.cache"
    SESSION_CACHE_ALIAS = "default"

    CELERY_BROKER_URL = REDIS_URL
    CELERY_RESULT_BACKEND = REDIS_URL

else:
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        }
    }


# ── Django REST Framework ─────────────────────────────────────────────────────

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],

    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticatedOrReadOnly",
    ],

    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],

    "DEFAULT_PAGINATION_CLASS": (
        "rest_framework.pagination.PageNumberPagination"
    ),

    "PAGE_SIZE": 20,
}


# ── Simple JWT ────────────────────────────────────────────────────────────────

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),

    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,

    "AUTH_HEADER_TYPES": ("Bearer",),
}
# # =============================================================================
# CORS
# =============================================================================

CORS_ALLOW_ALL_ORIGINS = False

CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ALLOWED_ORIGINS", "").split(",")
    if origin.strip()
]

CORS_ALLOW_CREDENTIALS = True


# =============================================================================
# CSRF
# =============================================================================

CSRF_TRUSTED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CSRF_TRUSTED_ORIGINS", "").split(",")
    if origin.strip()
]


# =============================================================================
# FRONTEND
# =============================================================================

FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    "http://localhost:5173",
)

# ── Static Files & Cloudinary Media ──────────────────────────────────────────

STATIC_URL = "/static/"

STATIC_ROOT = BASE_DIR / "staticfiles"


# Cloudinary credentials come from Railway environment variables.
CLOUDINARY_STORAGE = {
    "CLOUD_NAME": os.environ["CLOUDINARY_CLOUD_NAME"],
    "API_KEY": os.environ["CLOUDINARY_API_KEY"],
    "API_SECRET": os.environ["CLOUDINARY_API_SECRET"],
}


# Django 4.2+ storage configuration
STORAGES = {
    "default": {
        "BACKEND": "cloudinary_storage.storage.MediaCloudinaryStorage",
    },

    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}


# ── Stripe ────────────────────────────────────────────────────────────────────

STRIPE_PUBLIC_KEY = get_env("STRIPE_PUBLIC_KEY", "")

STRIPE_SECRET_KEY = get_env("STRIPE_SECRET_KEY", "")

STRIPE_WEBHOOK_SECRET = get_env(
    "STRIPE_WEBHOOK_SECRET",
    "",
).strip()

if STRIPE_SECRET_KEY:
    stripe.api_key = STRIPE_SECRET_KEY


# ── Email ─────────────────────────────────────────────────────────────────────
# Email configuration
if get_env("EMAIL_HOST_PASSWORD"):
    EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
    EMAIL_HOST = get_env("EMAIL_HOST", "smtp.sendgrid.net")
    EMAIL_PORT = int(get_env("EMAIL_PORT", "587"))
    EMAIL_USE_TLS = True
    EMAIL_HOST_USER = get_env("EMAIL_HOST_USER", "apikey")
    EMAIL_HOST_PASSWORD = get_env("EMAIL_HOST_PASSWORD")
else:
    EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

DEFAULT_FROM_EMAIL = get_env(
    "DEFAULT_FROM_EMAIL",
    "mwatsenzemwaguta14@gmail.com",
)

FRONTEND_URL = get_env(
    "FRONTEND_URL",
    "http://localhost:5173",
)

# Africa's Talking SMS
AT_USERNAME = get_env("AT_USERNAME", "sandbox")
AT_API_KEY = get_env("AT_API_KEY", "")


# ── Authentication Password Validators ────────────────────────────────────────

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "UserAttributeSimilarityValidator"
        ),
    },

    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "MinimumLengthValidator"
        ),
    },

    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "CommonPasswordValidator"
        ),
    },

    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "NumericPasswordValidator"
        ),
    },
]


# ── Miscellaneous ─────────────────────────────────────────────────────────────

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

LANGUAGE_CODE = "en-us"

TIME_ZONE = "UTC"

USE_I18N = True

USE_TZ = True

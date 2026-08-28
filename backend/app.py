from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask
from flask_cors import CORS

from middleware import (
    init_rate_limiter,
    register_error_handlers,
    register_request_logging,
    register_security_headers,
)
from routes.analytics_routes import analytics_bp
from routes.contact_routes import contacts_bp
from routes.family_routes import family_bp
from routes.gallery_routes import gallery_bp
from routes.post_routes import posts_bp
from routes.settings_routes import settings_bp
from routes.sponsor_routes import sponsors_bp
from routes.system_routes import system_bp
from routes.user_routes import users_bp
from routes.youtube_routes import youtube_bp
from utils.logging_config import setup_logging
from utils.env_check import validate_runtime_env

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")


def _init_sentry() -> None:
    dsn = os.getenv("SENTRY_DSN", "").strip()
    if not dsn:
        return
    try:
        import sentry_sdk
        from sentry_sdk.integrations.flask import FlaskIntegration
    except ImportError:
        setup_logging().warning("sentry-sdk not installed; Sentry disabled")
        return

    sentry_sdk.init(
        dsn=dsn,
        integrations=[FlaskIntegration()],
        traces_sample_rate=float(os.getenv("SENTRY_TRACES_SAMPLE_RATE", "0.1")),
        environment=os.getenv("FLASK_ENV", "production"),
        release=os.getenv("APP_VERSION", "1.0.0"),
    )


def create_app() -> Flask:
    logger = setup_logging()
    validate_runtime_env(logger)
    _init_sentry()

    app = Flask(__name__)
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY") or os.getenv(
        "JWT_SECRET", "dev-only-change-me"
    )
    app.config["JSON_SORT_KEYS"] = False

    origins = [
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS", "http://localhost:5173,http://localhost:8080"
        ).split(",")
        if origin.strip()
    ]
    CORS(
        app,
        resources={
            r"/api/*": {"origins": origins},
            r"/health": {"origins": origins},
            r"/version": {"origins": origins},
        },
        supports_credentials=False,
        max_age=600,
    )

    register_security_headers(app)
    register_request_logging(app)
    register_error_handlers(app)
    init_rate_limiter(app)

    app.register_blueprint(system_bp)
    app.register_blueprint(youtube_bp)
    app.register_blueprint(posts_bp)
    app.register_blueprint(contacts_bp)
    app.register_blueprint(family_bp)
    app.register_blueprint(gallery_bp)
    app.register_blueprint(sponsors_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(users_bp)
    app.register_blueprint(settings_bp)

    return app


app = create_app()


if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    debug = os.getenv("FLASK_ENV") == "development"
    app.run(host="0.0.0.0", port=port, debug=debug)

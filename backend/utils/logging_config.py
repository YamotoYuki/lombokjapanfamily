from __future__ import annotations

import logging
import os
from logging.handlers import RotatingFileHandler
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
LOG_DIR = BASE_DIR / "logs"
LOG_DIR.mkdir(parents=True, exist_ok=True)


def _make_handler(filename: str, level: int) -> RotatingFileHandler:
    handler = RotatingFileHandler(
        LOG_DIR / filename,
        maxBytes=5 * 1024 * 1024,
        backupCount=5,
        encoding="utf-8",
    )
    handler.setLevel(level)
    handler.setFormatter(
        logging.Formatter(
            "%(asctime)s | %(levelname)s | %(name)s | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
    )
    return handler


def setup_logging(app_name: str = "ljf") -> logging.Logger:
    level_name = os.getenv("LOG_LEVEL", "INFO").upper()
    level = getattr(logging, level_name, logging.INFO)

    root = logging.getLogger()
    if not root.handlers:
        root.setLevel(level)
        console = logging.StreamHandler()
        console.setLevel(level)
        console.setFormatter(logging.Formatter("%(asctime)s | %(levelname)s | %(message)s"))
        root.addHandler(console)
        root.addHandler(_make_handler("app.log", logging.INFO))
        root.addHandler(_make_handler("error.log", logging.ERROR))

    audit = logging.getLogger("audit")
    if not any(
        isinstance(h, RotatingFileHandler) and getattr(h, "baseFilename", "").endswith("audit.log")
        for h in audit.handlers
    ):
        audit.setLevel(logging.INFO)
        audit.propagate = False
        audit.addHandler(_make_handler("audit.log", logging.INFO))
        audit.addHandler(logging.StreamHandler())

    logger = logging.getLogger(app_name)
    logger.setLevel(level)
    return logger


def get_audit_logger() -> logging.Logger:
    setup_logging()
    return logging.getLogger("audit")

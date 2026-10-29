
import os
import re
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    get_jwt_identity,
    jwt_required,
)
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import URL, text
from sqlalchemy.exc import IntegrityError
from werkzeug.security import check_password_hash, generate_password_hash

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent

app = Flask(__name__)

# --------------------------------------------------
# 1. Environment configuration
# --------------------------------------------------

required_vars = [
    "SECRET_KEY",
    "JWT_SECRET_KEY",
    "DB_HOST",
    "DB_PORT",
    "DB_NAME",
    "DB_USER",
    "DB_PASSWORD",
    "DB_SSL_CA",
    "FRONTEND_ORIGIN",
]

missing = [
    key for key in required_vars
    if not os.getenv(key, "").strip()
]

if missing:
    raise RuntimeError(
        "Missing environment variables: " + ", ".join(missing)
    )

app.config["SECRET_KEY"] = os.environ["SECRET_KEY"]
app.config["JWT_SECRET_KEY"] = os.environ["JWT_SECRET_KEY"]
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(minutes=30)

# --------------------------------------------------
# 2. Aiven MySQL SSL certificate
# DB_SSL_CA can contain PEM contents or a file path.
# --------------------------------------------------

ssl_ca_value = os.environ["DB_SSL_CA"].strip()

if "-----BEGIN CERTIFICATE-----" in ssl_ca_value:
    ssl_ca_value = ssl_ca_value.replace("\\n", "\n")
    ssl_ca = "/tmp/jove_ems_aiven_ca.pem"

    with open(ssl_ca, "w", encoding="utf-8") as cert_file:
        cert_file.write(ssl_ca_value)
        if not ssl_ca_value.endswith("\n"):
            cert_file.write("\n")
else:
    ssl_ca_path = Path(ssl_ca_value)
    if not ssl_ca_path.is_absolute():
        ssl_ca_path = BASE_DIR / ssl_ca_path
    ssl_ca = str(ssl_ca_path)

if not os.path.isfile(ssl_ca):
    raise RuntimeError(
        "Aiven CA certificate not found. Check DB_SSL_CA."
    )

# --------------------------------------------------
# 3. Database configuration
# --------------------------------------------------

try:
    database_port = int(os.environ["DB_PORT"])
except ValueError as exc:
    raise RuntimeError("DB_PORT must be a valid port number.") from exc

database_url = URL.create(
    "mysql+pymysql",
    username=os.environ["DB_USER"],
    password=os.environ["DB_PASSWORD"],
    host=os.environ["DB_HOST"],
    port=database_port,
    database=os.environ["DB_NAME"],
)

app.config.update(
    SQLALCHEMY_DATABASE_URI=database_url,
    SQLALCHEMY_TRACK_MODIFICATIONS=False,
    SQLALCHEMY_ENGINE_OPTIONS={
        "pool_pre_ping": True,
        "connect_args": {
            "ssl": {"ca": ssl_ca}
        },
    },
)

db = SQLAlchemy(app)
jwt = JWTManager(app)

# --------------------------------------------------
# 4. CORS
# --------------------------------------------------

frontend_origin = os.environ["FRONTEND_ORIGIN"].rstrip("/")

CORS(
    app,
    resources={
        r"/api/*": {
            "origins": [frontend_origin],
        }
    },
)

# --------------------------------------------------
# 5. Rate limiting
# --------------------------------------------------

limiter = Limiter(
    key_func=get_remote_address,
    app=app,
    default_limits=[],
    storage_uri="memory://",
)

# --------------------------------------------------
# 6. Serve frontend pages
# --------------------------------------------------

@app.get("/")
def index_page():
    return send_from_directory(str(BASE_DIR), "index.html")


@app.get("/login")
@app.get("/index.html")
def login_page():
    return send_from_directory(str(BASE_DIR), "index.html")


@app.get("/register")
@app.get("/register.html")
def register_page():
    return send_from_directory(str(BASE_DIR), "register.html")


@app.get("/dashboard")
@app.get("/dashboard.html")
def dashboard_page():
    return send_from_directory(str(BASE_DIR), "dashboard.html")


# Serve frontend assets from their existing directories.
@app.get("/css/<path:filename>")
def css_files(filename):
    return send_from_directory(str(BASE_DIR / "css"), filename)


@app.get("/js/<path:filename>")
def js_files(filename):
    return send_from_directory(str(BASE_DIR / "js"), filename)


# Optional asset directories, if used by your HTML.
@app.get("/images/<path:filename>")
def image_files(filename):
    return send_from_directory(str(BASE_DIR / "images"), filename)


@app.get("/assets/<path:filename>")
def asset_files(filename):
    return send_from_directory(str(BASE_DIR / "assets"), filename)


# --------------------------------------------------
# 7. User database model
# The corresponding users table must exist in MySQL.
# --------------------------------------------------

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(
        db.BigInteger,
        primary_key=True,
        autoincrement=True,
    )
    full_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)

    role = db.Column(
        db.Enum("admin", "operator", "viewer"),
        nullable=False,
        default="operator",
    )

    is_active = db.Column(
        db.Boolean,
        nullable=False,
        default=True,
    )

    created_at = db.Column(
        db.DateTime,
        nullable=False,
        server_default=db.func.current_timestamp(),
    )

    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        server_default=db.func.current_timestamp(),
        onupdate=db.func.current_timestamp(),
    )


# --------------------------------------------------
# 8. Health checks
# --------------------------------------------------

@app.get("/api/health")
def health():
    return jsonify({
        "service": "Jove EMS API",
        "status": "ok",
    }), 200


@app.get("/api/health/db")
def database_health():
    try:
        db.session.execute(text("SELECT 1"))
        return jsonify({
            "service": "Jove EMS API",
            "database": "connected",
        }), 200
    except Exception:
        db.session.rollback()
        app.logger.exception("Database health check failed.")
        return jsonify({
            "service": "Jove EMS API",
            "database": "unavailable",
        }), 503


# --------------------------------------------------
# 9. User registration
# --------------------------------------------------

@app.post("/api/register")
@limiter.limit("5 per minute")
def register():
    data = request.get_json(silent=True) or {}

    full_name = str(data.get("full_name", "")).strip()
    email = str(data.get("email", "")).strip().lower()
    password = data.get("password", "")

    if not full_name or len(full_name) > 100:
        return jsonify({
            "error": "Enter a valid full name."
        }), 400

    if (
        len(email) > 255
        or not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email)
    ):
        return jsonify({
            "error": "Enter a valid email address."
        }), 400

    if not isinstance(password, str) or len(password) < 12:
        return jsonify({
            "error": "Password must be at least 12 characters."
        }), 400

    if len(password) > 128:
        return jsonify({
            "error": "Password is too long."
        }), 400

    try:
        if User.query.filter_by(email=email).first():
            return jsonify({
                "error": "An account with this email already exists."
            }), 409

        user = User(
            full_name=full_name,
            email=email,
            password_hash=generate_password_hash(password),
            role="operator",
            is_active=True,
        )

        db.session.add(user)
        db.session.commit()

        return jsonify({
            "message": "Account created successfully. Please log in."
        }), 201

    except IntegrityError:
        db.session.rollback()
        return jsonify({
            "error": "An account with this email already exists."
        }), 409

    except Exception:
        db.session.rollback()
        app.logger.exception("User registration failed.")
        return jsonify({
            "error": "Unable to create the account. Please try again."
        }), 500


# --------------------------------------------------
# 10. User login
# --------------------------------------------------

@app.post("/api/login")
@limiter.limit("5 per minute")
def login():
    data = request.get_json(silent=True) or {}

    email = str(data.get("email", "")).strip().lower()
    password = data.get("password", "")

    if not email or not isinstance(password, str):
        return jsonify({
            "error": "Invalid email or password."
        }), 401

    try:
        user = User.query.filter_by(email=email).first()

        if (
            not user
            or not check_password_hash(user.password_hash, password)
            or not user.is_active
        ):
            return jsonify({
                "error": "Invalid email or password."
            }), 401

        token = create_access_token(identity=str(user.id))

        return jsonify({
            "message": "Login successful",
            "access_token": token,
            "user": {
                "id": user.id,
                "full_name": user.full_name,
                "email": user.email,
                "role": user.role,
            },
        }), 200

    except Exception:
        app.logger.exception("Login failed.")
        return jsonify({
            "error": "Unable to process login. Please try again."
        }), 500


# --------------------------------------------------
# 11. Verify authenticated user
# --------------------------------------------------

@app.get("/api/me")
@jwt_required()
def current_user():
    user_id = get_jwt_identity()

    try:
        user = db.session.get(User, int(user_id))

        if not user or not user.is_active:
            return jsonify({
                "error": "Account unavailable."
            }), 401

        return jsonify({
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "role": user.role,
        }), 200

    except (ValueError, TypeError):
        return jsonify({
            "error": "Invalid authentication token."
        }), 401

    except Exception:
        app.logger.exception("User verification failed.")
        return jsonify({
            "error": "Unable to verify the account."
        }), 500


# --------------------------------------------------
# 12. Local development
# --------------------------------------------------

if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=False,
    )

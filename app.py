
import os
import re
from datetime import timedelta

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
from sqlalchemy import URL
from sqlalchemy.exc import IntegrityError
from werkzeug.security import check_password_hash, generate_password_hash

# Load .env locally. Vercel uses configured environment variables.
load_dotenv()

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

# --------------------------------------------------
# 2. Resolve Aiven MySQL SSL certificate
# DB_SSL_CA may contain a file path or PEM certificate
# --------------------------------------------------

ssl_ca_value = os.environ["DB_SSL_CA"].strip()

# Support certificate contents stored directly in Vercel.
if "-----BEGIN CERTIFICATE-----" in ssl_ca_value:
    ssl_ca_value = ssl_ca_value.replace("\\n", "\n")

    ssl_ca = "/tmp/jove_ems_aiven_ca.pem"

    with open(ssl_ca, "w", encoding="utf-8") as cert_file:
        cert_file.write(ssl_ca_value)

else:
    # Support a path to a certificate file.
    if os.path.isabs(ssl_ca_value):
        ssl_ca = ssl_ca_value
    else:
        ssl_ca = os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            ssl_ca_value,
        )

if not os.path.isfile(ssl_ca):
    raise RuntimeError(
        "Aiven CA certificate not found. "
        "Check the DB_SSL_CA environment variable."
    )

# --------------------------------------------------
# 3. Database configuration: Aiven MySQL
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
    SECRET_KEY=os.environ["SECRET_KEY"],
    SQLALCHEMY_DATABASE_URI=database_url,
    SQLALCHEMY_TRACK_MODIFICATIONS=False,
    SQLALCHEMY_ENGINE_OPTIONS={
        "pool_pre_ping": True,
        "connect_args": {
            "ssl": {
                "ca": ssl_ca,
            }
        },
    },
    JWT_SECRET_KEY=os.environ["JWT_SECRET_KEY"],
    JWT_ACCESS_TOKEN_EXPIRES=timedelta(minutes=30),
)

db = SQLAlchemy(app)
jwt = JWTManager(app)

# --------------------------------------------------
# 4. CORS configuration
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
# 6. User database model
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
# 7. API health check
# --------------------------------------------------

@app.get("/")
def index():
    return send_from_directory(
        os.path.dirname(os.path.abspath(__file__)),
        "index.html"
    )


@app.get("/api/health")
def health():
    return jsonify({
        "status": "ok",
        "service": "Jove EMS API",
    }), 200


# --------------------------------------------------
# 8. User registration
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

    # Basic email format validation.
    if (
        len(email) > 255
        or not re.fullmatch(
            r"[^@\s]+@[^@\s]+\.[^@\s]+",
            email,
        )
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

    try:
        db.session.add(user)
        db.session.commit()

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

    return jsonify({
        "message": "Account created successfully. Please log in."
    }), 201


# --------------------------------------------------
# 9. User login
# --------------------------------------------------

@app.post("/api/login")
@limiter.limit("5 per minute")
def login():
    data = request.get_json(silent=True) or {}

    email = str(data.get("email", "")).strip().lower()
    password = data.get("password", "")

    if not isinstance(password, str) or not email:
        return jsonify({
            "error": "Invalid email or password."
        }), 401

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


# --------------------------------------------------
# 10. Get currently authenticated user
# --------------------------------------------------

@app.get("/api/me")
@jwt_required()
def me():
    user_id = get_jwt_identity()

    try:
        user = db.session.get(User, int(user_id))
    except (ValueError, TypeError):
        return jsonify({
            "error": "Invalid authentication token."
        }), 401

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


# --------------------------------------------------
# 11. Local development entry point
# --------------------------------------------------

if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=False,
    )

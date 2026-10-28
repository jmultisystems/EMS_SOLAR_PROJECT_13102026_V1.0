
import os
import re
from datetime import timedelta

from dotenv import load_dotenv
from flask import Flask, jsonify, request
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
from werkzeug.security import check_password_hash, generate_password_hash

load_dotenv()

app = Flask(__name__)

# Configure Aiven MySQL connection with TLS certificate verification.
required_vars = [
    "SECRET_KEY", "JWT_SECRET_KEY", "DB_HOST", "DB_PORT",
    "DB_NAME", "DB_USER", "DB_PASSWORD", "DB_SSL_CA",
    "FRONTEND_ORIGIN",
]
missing = [key for key in required_vars if not os.getenv(key)]
if missing:
    raise RuntimeError("Missing environment variables: " + ", ".join(missing))

ssl_ca = os.environ["DB_SSL_CA"]
if not os.path.isfile(ssl_ca):
    raise RuntimeError("DB_SSL_CA must point to your downloaded Aiven CA certificate.")

database_url = URL.create(
    "mysql+pymysql",
    username=os.environ["DB_USER"],
    password=os.environ["DB_PASSWORD"],
    host=os.environ["DB_HOST"],
    port=int(os.environ["DB_PORT"]),
    database=os.environ["DB_NAME"],
)

app.config.update(
    SECRET_KEY=os.environ["SECRET_KEY"],
    SQLALCHEMY_DATABASE_URI=database_url,
    SQLALCHEMY_TRACK_MODIFICATIONS=False,
    SQLALCHEMY_ENGINE_OPTIONS={
        "connect_args": {"ssl": {"ca": ssl_ca}}
    },
    JWT_SECRET_KEY=os.environ["JWT_SECRET_KEY"],
    JWT_ACCESS_TOKEN_EXPIRES=timedelta(minutes=30),
)

db = SQLAlchemy(app)
jwt = JWTManager(app)

CORS(
    app,
    resources={r"/api/*": {"origins": os.environ["FRONTEND_ORIGIN"]}},
)

limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=[],
    storage_uri="memory://",
)


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    full_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(
        db.Enum("admin", "operator", "viewer"),
        nullable=False,
        default="operator",
    )
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(
        db.DateTime, nullable=False, server_default=db.func.current_timestamp()
    )
    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        server_default=db.func.current_timestamp(),
        onupdate=db.func.current_timestamp(),
    )


@app.get("/api/health")
def health():
    return jsonify({"status": "ok", "service": "Jove EMS API"}), 200


@app.post("/api/register")
@limiter.limit("5 per minute")
def register():
    data = request.get_json(silent=True) or {}

    full_name = str(data.get("full_name", "")).strip()
    email = str(data.get("email", "")).strip().lower()
    password = data.get("password", "")

    if not full_name or len(full_name) > 100:
        return jsonify({"error": "Enter a valid full name."}), 400

    if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email):
        return jsonify({"error": "Enter a valid email address."}), 400

    if not isinstance(password, str) or len(password) < 12:
        return jsonify({"error": "Password must be at least 12 characters."}), 400

    if len(password) > 128:
        return jsonify({"error": "Password is too long."}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "An account with this email already exists."}), 409

    user = User(
        full_name=full_name,
        email=email,
        password_hash=generate_password_hash(password),
        role="operator",  # Never accept a role from public registration.
        is_active=True,
    )

    db.session.add(user)
    db.session.commit()

    return jsonify({
        "message": "Account created successfully. Please log in."
    }), 201


@app.post("/api/login")
@limiter.limit("5 per minute")
def login():
    data = request.get_json(silent=True) or {}

    email = str(data.get("email", "")).strip().lower()
    password = data.get("password", "")

    user = User.query.filter_by(email=email).first()

    if (
        not user
        or not isinstance(password, str)
        or not check_password_hash(user.password_hash, password)
        or not user.is_active
    ):
        return jsonify({"error": "Invalid email or password."}), 401

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


@app.get("/api/me")
@jwt_required()
def me():
    user_id = get_jwt_identity()
    user = db.session.get(User, int(user_id))

    if not user or not user.is_active:
        return jsonify({"error": "Account unavailable."}), 401

    return jsonify({
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "role": user.role,
    }), 200


if __name__ == "__main__":
    # Local development only. Use a production WSGI server when deployed.
    app.run(host="127.0.0.1", port=5000, debug=False)

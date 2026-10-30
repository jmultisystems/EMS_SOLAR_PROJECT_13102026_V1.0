
import os
import re
import secrets
import smtplib
from datetime import datetime, timedelta
from email.message import EmailMessage
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


# --------------------------------------------------
# 1. APPLICATION CONFIGURATION
# --------------------------------------------------

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent

app = Flask(__name__)

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
    "ADMIN_EMAIL",
    "SMTP_EMAIL",
    "SMTP_PASSWORD",
    "SMTP_SERVER",
    "SMTP_PORT",
]

missing_vars = [
    name for name in required_vars
    if not os.getenv(name)
]

if missing_vars:
    raise RuntimeError(
        "Missing environment variables: "
        + ", ".join(missing_vars)
    )


app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(minutes=30)

# --------------------------------------------------
# 2. AIVEN MYSQL SSL CONFIGURATION
# --------------------------------------------------

db_ssl_ca = os.getenv("DB_SSL_CA")

if "-----BEGIN CERTIFICATE-----" in db_ssl_ca:
    ssl_ca_path = "/tmp/jove_ems_aiven_ca.pem"

    with open(ssl_ca_path, "w", encoding="utf-8") as ca_file:
        ca_file.write(db_ssl_ca)

else:
    ca_path = Path(db_ssl_ca)

    if not ca_path.is_absolute():
        ca_path = BASE_DIR / ca_path

    if not ca_path.exists():
        raise RuntimeError(
            f"Database SSL certificate not found: {ca_path}"
        )

    ssl_ca_path = str(ca_path)


database_url = URL.create(
    "mysql+pymysql",
    username=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    host=os.getenv("DB_HOST"),
    port=int(os.getenv("DB_PORT")),
    database=os.getenv("DB_NAME"),
)

app.config["SQLALCHEMY_DATABASE_URI"] = database_url
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_pre_ping": True,
    "pool_recycle": 280,
    "connect_args": {
        "ssl": {
            "ca": ssl_ca_path
        },
        "connect_timeout": 10,
    },
}

db = SQLAlchemy(app)
jwt = JWTManager(app)


# --------------------------------------------------
# 3. CORS CONFIGURATION
# --------------------------------------------------

frontend_origins = [
    origin.strip()
    for origin in os.getenv("FRONTEND_ORIGIN", "").split(",")
    if origin.strip()
]

CORS(
    app,
    resources={
        r"/api/*": {
            "origins": frontend_origins
        }
    },
    supports_credentials=True,
)


# --------------------------------------------------
# 4. RATE LIMITER
# --------------------------------------------------

limiter = Limiter(
    get_remote_address,
    app=app,
    storage_uri="memory://",
    default_limits=[],
)

# --------------------------------------------------
# 5. EMAIL CONFIGURATION
# --------------------------------------------------

ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "").strip()
SMTP_EMAIL = os.getenv("SMTP_EMAIL", "").strip()
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "").replace(" ", "")
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com").strip()
SMTP_PORT = int(os.getenv("SMTP_PORT", "465"))


def send_admin_otp_email(
    otp,
    full_name,
    user_email,
    company_name
):
    message = EmailMessage()

    message["Subject"] = "Jove EMS - Registration Approval OTP"
    message["From"] = f"Jove EMS <{SMTP_EMAIL}>"
    message["To"] = ADMIN_EMAIL

    message.set_content(
        f"""
JOVE MULTISYSTEMS
Energy Management System

A new user has requested access to Jove EMS.

Registration Details
--------------------
Name: {full_name}
Email: {user_email}
Company: {company_name or "Not provided"}

ADMIN APPROVAL OTP
------------------
OTP: {otp}

This OTP is valid for 5 minutes.
Maximum incorrect attempts: 5.

Please share this OTP only with the intended applicant
after verifying their registration request.

Regards,
Jove EMS
"""
    )

    try:
        # Gmail SMTP over SSL - Port 465
        with smtplib.SMTP_SSL(
            SMTP_SERVER,
            SMTP_PORT,
            timeout=20
        ) as server:

            server.login(
                SMTP_EMAIL,
                SMTP_PASSWORD
            )

            server.send_message(message)

        app.logger.info(
            "Admin OTP email sent successfully."
        )

    except Exception:
        app.logger.exception(
            "Gmail SMTP email delivery failed."
        )
        raise
# --------------------------------------------------
# 6. USER DATABASE MODEL
# --------------------------------------------------

class User(db.Model):

    __tablename__ = "users"

    id = db.Column(
        db.BigInteger,
        primary_key=True,
        autoincrement=True
    )

    full_name = db.Column(
        db.String(100),
        nullable=False
    )

    email = db.Column(
        db.String(255),
        unique=True,
        nullable=False
    )

    company_name = db.Column(
        db.String(150),
        nullable=False,
        default="",
        server_default=""
    )

    password_hash = db.Column(
        db.String(255),
        nullable=False
    )

    role = db.Column(
        db.Enum("admin", "operator", "viewer"),
        nullable=False,
        default="operator"
    )

    is_active = db.Column(
        db.Boolean,
        nullable=False,
        default=True,
        server_default=text("1")
    )

    created_at = db.Column(
        db.DateTime,
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP")
    )

    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP"),
        onupdate=datetime.utcnow
    )


# --------------------------------------------------
# 7. PENDING REGISTRATION MODEL
# --------------------------------------------------

class PendingRegistration(db.Model):

    __tablename__ = "pending_registrations"

    id = db.Column(
        db.BigInteger,
        primary_key=True,
        autoincrement=True
    )

    email = db.Column(
        db.String(255),
        unique=True,
        nullable=False
    )

    full_name = db.Column(
        db.String(100),
        nullable=False
    )

    company_name = db.Column(
        db.String(150),
        nullable=False,
        default=""
    )

    otp_hash = db.Column(
        db.String(255),
        nullable=False
    )

    expires_at = db.Column(
        db.DateTime,
        nullable=False
    )

    attempts = db.Column(
        db.Integer,
        nullable=False,
        default=0
    )

    created_at = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow
    )


# --------------------------------------------------
# 8. COMMON VALIDATION
# --------------------------------------------------

def valid_email(email):
    return bool(
        re.fullmatch(
            r"[^@\s]+@[^@\s]+\.[^@\s]+",
            email
        )
    )


def get_json_body():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return None

    return data


# --------------------------------------------------
# 9. FRONTEND PAGE ROUTES
# --------------------------------------------------

@app.get("/")
@app.get("/index.html")
@app.get("/login")
def login_page():
    return send_from_directory(BASE_DIR, "index.html")


@app.get("/register")
@app.get("/register.html")
def register_page():
    return send_from_directory(BASE_DIR, "register.html")


@app.get("/dashboard")
@app.get("/dashboard.html")
def dashboard_page():
    return send_from_directory(BASE_DIR, "dashboard.html")


@app.get("/energy_meter_data")
@app.get("/energy_meter_data.html")
def energy_meter_data_page():
    return send_from_directory(BASE_DIR, "energy_meter_data.html")


# --------------------------------------------------
# 10. CSS FILE ROUTES
# --------------------------------------------------

@app.get("/login.css")
@app.get("/register.css")
@app.get("/dashboard.css")
@app.get("/energy_meter_data.css")
def css_files():
    return send_from_directory(
        BASE_DIR,
        request.path.lstrip("/")
    )


# --------------------------------------------------
# 11. JAVASCRIPT FILE ROUTES
# --------------------------------------------------

@app.get("/register.js")
@app.get("/dashboard.js")
@app.get("/energy_meter_data.js")
def javascript_files():
    return send_from_directory(
        BASE_DIR,
        request.path.lstrip("/")
    )


# --------------------------------------------------
# 12. HEALTH CHECK API
# --------------------------------------------------

@app.get("/api/health")
def health_check():
    return jsonify({
        "status": "success",
        "service": "Jove EMS API",
        "message": "API is running"
    }), 200


@app.get("/api/health/db")
def database_health_check():

    try:
        db.session.execute(text("SELECT 1"))

        return jsonify({
            "status": "success",
            "database": "connected"
        }), 200

    except Exception:
        app.logger.exception("Database health check failed")

        return jsonify({
            "status": "error",
            "database": "connection failed"
        }), 500


# --------------------------------------------------
# 13. REQUEST REGISTRATION OTP
# --------------------------------------------------

@app.post("/api/request-registration-otp")
@limiter.limit("3 per 10 minutes")
def request_registration_otp():

    data = get_json_body()

    if data is None:
        return jsonify({
            "error": "Invalid request data."
        }), 400

    full_name = str(
        data.get("full_name", "")
    ).strip()

    email = str(
        data.get("email", "")
    ).strip().lower()

    company_name = str(
        data.get("company_name", "")
    ).strip()

    if not full_name or not email:
        return jsonify({
            "error": "Full name and email are required."
        }), 400

    if len(full_name) > 100:
        return jsonify({
            "error": "Full name must not exceed 100 characters."
        }), 400

    if len(email) > 255 or not valid_email(email):
        return jsonify({
            "error": "Please enter a valid email address."
        }), 400

    if len(company_name) > 150:
        return jsonify({
            "error": "Company name must not exceed 150 characters."
        }), 400

    try:
        existing_user = User.query.filter_by(
            email=email
        ).first()

        if existing_user:
            return jsonify({
                "error": "An account with this email already exists."
            }), 409

        otp = f"{secrets.randbelow(900000) + 100000}"

        now = datetime.utcnow()

        pending = PendingRegistration.query.filter_by(
            email=email
        ).first()

        if pending:
            pending.full_name = full_name
            pending.company_name = company_name
            pending.otp_hash = generate_password_hash(otp)
            pending.expires_at = now + timedelta(minutes=5)
            pending.attempts = 0
            pending.created_at = now

        else:
            pending = PendingRegistration(
                full_name=full_name,
                email=email,
                company_name=company_name,
                otp_hash=generate_password_hash(otp),
                expires_at=now + timedelta(minutes=5),
                attempts=0,
                created_at=now
            )

            db.session.add(pending)

        db.session.commit()

        try:
            send_admin_otp_email(
                otp=otp,
                full_name=full_name,
                user_email=email,
                company_name=company_name
            )

        except Exception:
            app.logger.exception("Admin OTP email sending failed")

            db.session.delete(pending)
            db.session.commit()

            return jsonify({
                "error": "Unable to send approval OTP. Please try again later."
            }), 502

        return jsonify({
            "status": "success",
            "message": "OTP sent to the Jove EMS Admin. Please contact the Admin for the approval code."
        }), 200

    except IntegrityError:
        db.session.rollback()

        return jsonify({
            "error": "Registration request could not be processed. Please try again."
        }), 409

    except Exception:
        db.session.rollback()
        app.logger.exception("Registration OTP request failed")

        return jsonify({
            "error": "An unexpected error occurred while requesting OTP."
        }), 500


# --------------------------------------------------
# 14. VERIFY OTP AND CREATE USER ACCOUNT
# --------------------------------------------------

@app.post("/api/verify-registration-otp")
@limiter.limit("10 per 10 minutes")
def verify_registration_otp():

    data = get_json_body()

    if data is None:
        return jsonify({
            "error": "Invalid request data."
        }), 400

    full_name = str(
        data.get("full_name", "")
    ).strip()

    email = str(
        data.get("email", "")
    ).strip().lower()

    company_name = str(
        data.get("company_name", "")
    ).strip()

    otp = str(
        data.get("otp", "")
    ).strip()

    password = data.get("password", "")
    confirm_password = data.get("confirm_password", "")

    if not full_name or not email or not otp:
        return jsonify({
            "error": "Please complete all required fields."
        }), 400

    if not isinstance(password, str) or not isinstance(confirm_password, str):
        return jsonify({
            "error": "Invalid password data."
        }), 400

    if len(full_name) > 100 or len(company_name) > 150:
        return jsonify({
            "error": "Registration details exceed the allowed length."
        }), 400

    if len(email) > 255 or not valid_email(email):
        return jsonify({
            "error": "Please enter a valid email address."
        }), 400

    if not re.fullmatch(r"[0-9]{6}", otp):
        return jsonify({
            "error": "Please enter a valid 6-digit OTP."
        }), 400

    if len(password) < 12 or len(password) > 128:
        return jsonify({
            "error": "Password must contain between 12 and 128 characters."
        }), 400

    if password != confirm_password:
        return jsonify({
            "error": "Passwords do not match."
        }), 400

    try:
        # Lock the pending registration row during verification.
        pending = (
            PendingRegistration.query
            .filter_by(email=email)
            .with_for_update()
            .first()
        )

        if not pending:
            return jsonify({
                "error": "No pending registration found. Please request a new OTP."
            }), 404

        now = datetime.utcnow()

        if pending.expires_at <= now:
            db.session.delete(pending)
            db.session.commit()

            return jsonify({
                "error": "OTP has expired. Please request a new OTP."
            }), 400

        if pending.attempts >= 5:
            db.session.delete(pending)
            db.session.commit()

            return jsonify({
                "error": "Maximum OTP attempts reached. Please request a new OTP."
            }), 429

        if not check_password_hash(pending.otp_hash, otp):

            pending.attempts += 1

            remaining = 5 - pending.attempts

            if remaining <= 0:
                db.session.delete(pending)
                db.session.commit()

                return jsonify({
                    "error": "Maximum OTP attempts reached. Please request a new OTP."
                }), 429

            db.session.commit()

            return jsonify({
                "error": f"Incorrect OTP. {remaining} attempts remaining."
            }), 400

        # Confirm the details match the pending request.
        if (
            pending.full_name != full_name
            or pending.company_name != company_name
        ):
            return jsonify({
                "error": "Registration details do not match the OTP request."
            }), 400

        existing_user = User.query.filter_by(
            email=email
        ).first()

        if existing_user:
            db.session.delete(pending)
            db.session.commit()

            return jsonify({
                "error": "An account with this email already exists."
            }), 409

        new_user = User(
            full_name=pending.full_name,
            email=pending.email,
            company_name=pending.company_name,
            password_hash=generate_password_hash(password),
            role="operator",
            is_active=True
        )

        db.session.add(new_user)
        db.session.delete(pending)

        db.session.commit()

        return jsonify({
            "status": "success",
            "message": "Account created successfully. Please log in."
        }), 201

    except IntegrityError:
        db.session.rollback()

        return jsonify({
            "error": "An account with this email may already exist."
        }), 409

    except Exception:
        db.session.rollback()
        app.logger.exception("OTP verification failed")

        return jsonify({
            "error": "An unexpected error occurred during registration."
        }), 500


# --------------------------------------------------
# 15. DISABLE OLD DIRECT REGISTRATION API
# --------------------------------------------------

@app.post("/api/register")
def old_registration_disabled():

    return jsonify({
        "error": "Direct registration is disabled. Please use the Admin OTP registration process."
    }), 410


# --------------------------------------------------
# 16. USER LOGIN API
# --------------------------------------------------

@app.post("/api/login")
@limiter.limit("5 per minute")
def login():

    data = get_json_body()

    if data is None:
        return jsonify({
            "error": "Invalid request data."
        }), 400

    email = str(
        data.get("email", "")
    ).strip().lower()

    password = data.get("password", "")

    if not email or not isinstance(password, str) or not password:
        return jsonify({
            "error": "Email and password are required."
        }), 400

    try:
        user = User.query.filter_by(
            email=email
        ).first()

        if (
            not user
            or not check_password_hash(user.password_hash, password)
        ):
            return jsonify({
                "error": "Invalid email or password."
            }), 401

        if not user.is_active:
            return jsonify({
                "error": "Your account is inactive. Please contact the Admin."
            }), 403

        access_token = create_access_token(
            identity=str(user.id)
        )

        return jsonify({
            "status": "success",
            "message": "Login successful",
            "access_token": access_token,
            "user": {
                "id": user.id,
                "full_name": user.full_name,
                "email": user.email,
                "company_name": user.company_name,
                "role": user.role
            }
        }), 200

    except Exception:
        app.logger.exception("Login failed")

        return jsonify({
            "error": "Unable to process login request."
        }), 500


# --------------------------------------------------
# 17. CURRENT USER API
# --------------------------------------------------

@app.get("/api/me")
@jwt_required()
def get_current_user():

    try:
        user_id = get_jwt_identity()

        user = db.session.get(
            User,
            int(user_id)
        )

        if not user:
            return jsonify({
                "error": "User not found."
            }), 404

        if not user.is_active:
            return jsonify({
                "error": "Your account is inactive."
            }), 403

        return jsonify({
            "status": "success",
            "user": {
                "id": user.id,
                "full_name": user.full_name,
                "email": user.email,
                "company_name": user.company_name,
                "role": user.role
            }
        }), 200

    except Exception:
        app.logger.exception("Current user lookup failed")

        return jsonify({
            "error": "Unable to retrieve user details."
        }), 500


# --------------------------------------------------
# 18. CREATE DATABASE TABLES IF MISSING
# --------------------------------------------------

with app.app_context():
    db.create_all()


# --------------------------------------------------
# 19. LOCAL DEVELOPMENT
# --------------------------------------------------

if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=False
    )

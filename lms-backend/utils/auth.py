"""
utils/auth.py
-------------
Authentication utilities for password hashing and JWT token management.

Responsibilities
----------------
- hash_password    : Apply bcrypt to a plaintext password before storage.
- verify_password  : Compare a plaintext password against a stored hash
                     using constant-time comparison to prevent timing attacks.
- create_access_token : Mint a HS256-signed JWT embedding user identity
                        and role, with a 24-hour expiration window.
- verify_token     : Decode and validate a JWT, returning None on any
                     failure rather than raising an exception, so callers
                     can handle unauthorised access with their own HTTP
                     status codes.

Security Configuration
----------------------
SECRET_KEY must be rotated before production deployment and sourced from
an environment variable rather than being hardcoded. A compromised key
allows arbitrary JWT forgery.

ALGORITHM is HS256 (HMAC-SHA256), which requires the same secret for
signing and verification. RS256 (asymmetric) would be more appropriate
for multi-service architectures where verification can happen without
exposing the signing key.

ACCESS_TOKEN_EXPIRE_HOURS is set to 24 hours. Shorter expiry windows
reduce the blast radius of a stolen token but increase login friction.
"""

from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta
from jose import JWTError

# bcrypt hashing context.
# deprecated="auto" ensures older hash schemes are transparently
# re-hashed the next time the user logs in, enabling algorithm migration.
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

# WARNING: This key must be replaced with a long, random secret sourced
# from an environment variable before deploying to production.
SECRET_KEY = "lms_super_secret_key_2026"

# HS256 (HMAC-SHA256) is used for symmetric JWT signing.
ALGORITHM = "HS256"

# Tokens expire 24 hours after issuance. Adjust this value based on the
# application's security vs. UX trade-off requirements.
ACCESS_TOKEN_EXPIRE_HOURS = 24


def hash_password(password):
    """
    Hashes a plaintext password with bcrypt before database storage.

    bcrypt automatically generates a random salt and embeds it in the
    hash string, so no separate salt management is required.

    Args:
        password (str): The plaintext password supplied during registration.

    Returns:
        str: The bcrypt-hashed password string, safe to persist in the database.
    """

    return pwd_context.hash(password)


def verify_password(
    plain_password,
    hashed_password
):
    """
    Verifies a plaintext password against a stored bcrypt hash.

    Uses passlib's constant-time comparison to mitigate timing attacks
    that could otherwise reveal the existence of a valid password prefix.

    Args:
        plain_password   (str): The password submitted during login.
        hashed_password  (str): The bcrypt hash retrieved from the database.

    Returns:
        bool: True if the password matches the hash, False otherwise.
    """

    return pwd_context.verify(
        plain_password,
        hashed_password
    )


def create_access_token(data: dict):
    """
    Mints a signed JWT access token embedding the provided user claims.

    Adds an `exp` (expiration) claim set to 24 hours from the current
    UTC time. The token is signed with HS256 using SECRET_KEY.

    Args:
        data (dict): Claims to embed in the token payload.
                     Expected keys: user_id (int), email (str), role (str).

    Returns:
        str: The encoded JWT string to be returned to the client.
    """

    to_encode = data.copy()

    # Set the expiration claim so the token becomes invalid after the window.
    expire = datetime.utcnow() + timedelta(hours=24)

    to_encode.update(
        {"exp": expire}
    )

    encoded_jwt = jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return encoded_jwt


def verify_token(token: str):
    """
    Decodes and validates a JWT access token.

    Returns None on any failure (expired, malformed, wrong signature)
    rather than propagating the JWTError. Route handlers are responsible
    for converting a None return value into an appropriate HTTP 401.

    Args:
        token (str): The raw JWT string from the Authorization header.

    Returns:
        dict | None: The decoded payload on success, or None if the token
                     is invalid, expired, or tampered with.
    """

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        return payload

    except JWTError:
        # Treat all JWT failures uniformly. Callers should raise HTTP 401.
        return None
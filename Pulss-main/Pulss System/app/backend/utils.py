import secrets
import string


def generate_id() -> str:
    return secrets.token_hex(8)


def generate_token(length: int = 24) -> str:
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))

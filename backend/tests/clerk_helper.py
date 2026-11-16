# Helper: obtain Clerk session tokens / sign-in tickets for test users via Clerk Backend API (secret never printed)
import os
import sys
import json
import requests
from dotenv import dotenv_values

_ENV = dotenv_values("/app/backend/.env")
SK = _ENV.get("CLERK_SECRET_KEY")
API = "https://api.clerk.com/v1"
H = {"Authorization": f"Bearer {SK}", "User-Agent": "emergent-test-agent", "Content-Type": "application/json"}


def find_user(email):
    r = requests.get(f"{API}/users", params={"email_address": email}, headers=H, timeout=20)
    r.raise_for_status()
    users = r.json()
    return users[0] if users else None


def ensure_user(email, password="TestPass#2026xyz"):
    u = find_user(email)
    if u:
        return u
    r = requests.post(f"{API}/users", headers=H, timeout=20, json={
        "email_address": [email], "password": password, "skip_password_checks": True})
    r.raise_for_status()
    return r.json()


def session_token(user_id):
    s = requests.post(f"{API}/sessions", headers=H, json={"user_id": user_id}, timeout=20)
    s.raise_for_status()
    t = requests.post(f"{API}/sessions/{s.json()['id']}/tokens", headers=H, json={"expires_in_seconds": 3600}, timeout=20)
    t.raise_for_status()
    return t.json()["jwt"]


def sign_in_ticket(user_id):
    r = requests.post(f"{API}/sign_in_tokens", headers=H, json={"user_id": user_id, "expires_in_seconds": 3600}, timeout=20)
    r.raise_for_status()
    return r.json()["token"]


if __name__ == "__main__":
    cmd = sys.argv[1]
    if cmd == "info":
        u = find_user(sys.argv[2])
        print(json.dumps(None if not u else {"id": u["id"], "emails": [(e["email_address"], e["verification"]["status"]) for e in u["email_addresses"]]}))
    elif cmd == "ensure":
        u = ensure_user(sys.argv[2])
        print(u["id"])
    elif cmd == "token":
        print(session_token(sys.argv[2]))
    elif cmd == "ticket":
        print(sign_in_ticket(sys.argv[2]))

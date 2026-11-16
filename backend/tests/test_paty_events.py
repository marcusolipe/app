# PATY INVESTIGA - Agenda de Eventos: evento type, event_date validation, sorting, upcoming filter, likes/comments
import uuid
from datetime import date, timedelta
import pytest
import requests
from dotenv import dotenv_values

from clerk_helper import session_token

BASE_URL = dotenv_values("/app/frontend/.env")["REACT_APP_BACKEND_URL"].rstrip("/")
ADMIN_UID = "user_3MCsamENPXa0SiincsaiQTtcRb5"


@pytest.fixture(scope="module")
def admin_h():
    return {"Authorization": f"Bearer {session_token(ADMIN_UID)}"}


@pytest.fixture(scope="module")
def created(admin_h):
    ids = []
    yield ids
    for pid in ids:
        requests.delete(f"{BASE_URL}/api/admin/posts/{pid}", headers=admin_h)


def _ev(**kw):
    b = {"type": "evento", "title": f"TEST_evento_{uuid.uuid4().hex[:6]}", "summary": "s", "content": "c",
         "event_date": (date.today() + timedelta(days=5)).isoformat(), "event_time": "18:00", "location": "TEST_local"}
    b.update(kw)
    return b


class TestEventsPublic:
    def test_list_eventos_sorted(self):
        r = requests.get(f"{BASE_URL}/api/posts", params={"type": "evento"})
        assert r.status_code == 200
        data = r.json()
        assert len(data) >= 4
        assert all(p["type"] == "evento" for p in data)
        dates = [p["event_date"] for p in data]
        assert dates == sorted(dates)
        for p in data:
            assert "event_time" in p and "location" in p

    def test_upcoming_only_future(self):
        r = requests.get(f"{BASE_URL}/api/posts", params={"type": "evento", "upcoming": "true"})
        assert r.status_code == 200
        today = requests.get(f"{BASE_URL}/api/posts", params={"type": "evento"}).json()
        # server date compare: all returned >= min upcoming and are strings in YYYY-MM-DD
        data = r.json()
        assert len(data) >= 4
        assert all(len(p["event_date"]) == 10 for p in data)
        assert len(data) <= len(today)

    def test_upcoming_limit(self):
        r = requests.get(f"{BASE_URL}/api/posts", params={"type": "evento", "upcoming": "true", "limit": 4})
        assert r.status_code == 200 and len(r.json()) <= 4


class TestEventsAdmin:
    def test_create_event_and_get(self, admin_h, created):
        r = requests.post(f"{BASE_URL}/api/admin/posts", headers=admin_h, json=_ev())
        assert r.status_code == 200, r.text
        p = r.json()
        created.append(p["id"])
        g = requests.get(f"{BASE_URL}/api/posts/{p['id']}").json()
        assert g["type"] == "evento" and g["event_time"] == "18:00" and g["location"] == "TEST_local"
        ids = [x["id"] for x in requests.get(f"{BASE_URL}/api/posts", params={"type": "evento", "upcoming": "true"}).json()]
        assert p["id"] in ids

    def test_past_event_excluded_from_upcoming(self, admin_h, created):
        past = (date.today() - timedelta(days=10)).isoformat()
        r = requests.post(f"{BASE_URL}/api/admin/posts", headers=admin_h, json=_ev(event_date=past))
        assert r.status_code == 200
        pid = r.json()["id"]
        created.append(pid)
        up = [x["id"] for x in requests.get(f"{BASE_URL}/api/posts", params={"type": "evento", "upcoming": "true"}).json()]
        allv = [x["id"] for x in requests.get(f"{BASE_URL}/api/posts", params={"type": "evento"}).json()]
        assert pid not in up and pid in allv

    def test_empty_event_date_ok(self, admin_h, created):
        r = requests.post(f"{BASE_URL}/api/admin/posts", headers=admin_h, json=_ev(event_date=""))
        assert r.status_code == 200
        created.append(r.json()["id"])
        assert r.json()["event_date"] == ""

    @pytest.mark.parametrize("bad", ["25/12/2026", "2026-1-5", "abc", "2026-12-05T10:00"])
    def test_invalid_date_422(self, admin_h, bad):
        r = requests.post(f"{BASE_URL}/api/admin/posts", headers=admin_h, json=_ev(event_date=bad))
        assert r.status_code == 422

    def test_impossible_date(self, admin_h, created):
        r = requests.post(f"{BASE_URL}/api/admin/posts", headers=admin_h, json=_ev(event_date="2026-13-45"))
        if r.status_code == 200:
            created.append(r.json()["id"])
        assert r.status_code == 422, "impossible calendar date accepted"

    def test_edit_event(self, admin_h, created):
        r = requests.post(f"{BASE_URL}/api/admin/posts", headers=admin_h, json=_ev())
        pid = r.json()["id"]
        created.append(pid)
        nd = (date.today() + timedelta(days=40)).isoformat()
        u = requests.put(f"{BASE_URL}/api/admin/posts/{pid}", headers=admin_h, json=_ev(event_date=nd, location="TEST_novo"))
        assert u.status_code == 200
        g = requests.get(f"{BASE_URL}/api/posts/{pid}").json()
        assert g["event_date"] == nd and g["location"] == "TEST_novo"

    def test_event_like_and_comment(self, admin_h, created):
        r = requests.post(f"{BASE_URL}/api/admin/posts", headers=admin_h, json=_ev())
        pid = r.json()["id"]
        created.append(pid)
        lk = requests.post(f"{BASE_URL}/api/posts/{pid}/like")
        assert lk.status_code == 200 and lk.json()["likes"] == 1
        c = requests.post(f"{BASE_URL}/api/posts/{pid}/comments", json={"name": "TEST_n", "content": "oi"})
        assert c.status_code == 200
        lst = requests.get(f"{BASE_URL}/api/posts/{pid}/comments").json()
        assert len(lst) == 1
        assert requests.get(f"{BASE_URL}/api/posts/{pid}").json()["comments_count"] == 1

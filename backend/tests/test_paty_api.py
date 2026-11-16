# PATY INVESTIGA backend regression tests: public posts/likes/comments, admin CRUD, upload, users/roles, auth gates
import os
import uuid
import pytest
import requests
from dotenv import dotenv_values

from clerk_helper import session_token

BASE_URL = dotenv_values("/app/frontend/.env")["REACT_APP_BACKEND_URL"].rstrip("/")
ADMIN_UID = "user_3MCsamENPXa0SiincsaiQTtcRb5"   # admin+clerk_test@example.com
MEMBER_UID = "user_3MCsaw0mn5X7meFNUIYJPfHXJv2"  # leitor+clerk_test@example.com


@pytest.fixture(scope="module")
def admin_h():
    return {"Authorization": f"Bearer {session_token(ADMIN_UID)}"}


@pytest.fixture(scope="module")
def member_h():
    return {"Authorization": f"Bearer {session_token(MEMBER_UID)}"}


@pytest.fixture(scope="module")
def created(admin_h):
    ids = []
    yield ids
    for pid in ids:
        requests.delete(f"{BASE_URL}/api/admin/posts/{pid}", headers=admin_h)


@pytest.fixture(scope="module")
def test_post(admin_h, created):
    r = requests.post(f"{BASE_URL}/api/admin/posts", headers=admin_h, json={
        "type": "noticia", "title": f"TEST_post_{uuid.uuid4().hex[:6]}", "summary": "s", "content": "c"})
    assert r.status_code == 200, r.text
    created.append(r.json()["id"])
    return r.json()


# ---- Public posts ----
class TestPublic:
    def test_list_posts(self):
        r = requests.get(f"{BASE_URL}/api/posts")
        assert r.status_code == 200
        data = r.json()
        assert len(data) >= 9
        assert all("_id" not in p for p in data)

    @pytest.mark.parametrize("t", ["noticia", "entrevista", "video", "reel", "coluna"])
    def test_filter_type(self, t):
        r = requests.get(f"{BASE_URL}/api/posts", params={"type": t})
        assert r.status_code == 200
        assert len(r.json()) >= 1 and all(p["type"] == t for p in r.json())

    def test_invalid_type_422(self):
        assert requests.get(f"{BASE_URL}/api/posts", params={"type": "xx"}).status_code == 422

    def test_search_q(self):
        r = requests.get(f"{BASE_URL}/api/posts", params={"q": "ilha grande"})
        assert r.status_code == 200
        assert any("Ilha Grande" in p["title"] for p in r.json())

    def test_search_regex_special_chars(self):
        r = requests.get(f"{BASE_URL}/api/posts", params={"q": "("})
        assert r.status_code == 200, f"q='(' returned {r.status_code}"

    def test_get_post_and_404(self, test_post):
        r = requests.get(f"{BASE_URL}/api/posts/{test_post['id']}")
        assert r.status_code == 200 and r.json()["title"] == test_post["title"]
        assert requests.get(f"{BASE_URL}/api/posts/nonexistent").status_code == 404

    def test_like_unlike(self, test_post):
        pid = test_post["id"]
        r = requests.post(f"{BASE_URL}/api/posts/{pid}/like")
        assert r.status_code == 200 and r.json()["likes"] == 1
        r = requests.post(f"{BASE_URL}/api/posts/{pid}/like", params={"unlike": "true"})
        assert r.json()["likes"] == 0
        # unlike at 0 -> 404 (guards negative)
        r = requests.post(f"{BASE_URL}/api/posts/{pid}/like", params={"unlike": "true"})
        assert r.status_code == 404
        assert requests.get(f"{BASE_URL}/api/posts/{pid}").json()["likes"] == 0

    def test_comments_flow(self, test_post):
        pid = test_post["id"]
        r = requests.post(f"{BASE_URL}/api/posts/{pid}/comments", json={"name": "TEST_Leitor", "content": "Ótimo!"})
        assert r.status_code == 200
        c = r.json()
        assert c["name"] == "TEST_Leitor" and c["post_id"] == pid
        lst = requests.get(f"{BASE_URL}/api/posts/{pid}/comments").json()
        assert any(x["id"] == c["id"] for x in lst)
        assert requests.get(f"{BASE_URL}/api/posts/{pid}").json()["comments_count"] == 1

    @pytest.mark.parametrize("body", [{"name": "", "content": "x"}, {"name": "a", "content": ""}, {"content": "x"}, {"name": "a"}])
    def test_comment_validation(self, test_post, body):
        r = requests.post(f"{BASE_URL}/api/posts/{test_post['id']}/comments", json=body)
        assert r.status_code == 422

    def test_comment_whitespace_only_rejected(self, test_post):
        r = requests.post(f"{BASE_URL}/api/posts/{test_post['id']}/comments", json={"name": "   ", "content": "   "})
        assert r.status_code == 422, f"whitespace-only comment accepted: {r.status_code}"

    def test_comment_on_missing_post(self):
        r = requests.post(f"{BASE_URL}/api/posts/nonexistent/comments", json={"name": "a", "content": "b"})
        assert r.status_code == 404


# ---- Auth gates ----
class TestAuthGates:
    @pytest.mark.parametrize("method,path", [("get", "/api/me"), ("get", "/api/admin/posts"), ("post", "/api/admin/posts"),
                                             ("get", "/api/admin/comments"), ("get", "/api/users"), ("post", "/api/admin/upload")])
    def test_no_token_401(self, method, path):
        r = getattr(requests, method)(f"{BASE_URL}{path}")
        assert r.status_code == 401, f"{path} -> {r.status_code}"

    def test_bad_token_401(self):
        r = requests.get(f"{BASE_URL}/api/me", headers={"Authorization": "Bearer garbage"})
        assert r.status_code == 401

    def test_me(self, admin_h, member_h):
        a = requests.get(f"{BASE_URL}/api/me", headers=admin_h).json()
        m = requests.get(f"{BASE_URL}/api/me", headers=member_h).json()
        assert a["role"] == "admin" and m["role"] == "member"

    @pytest.mark.parametrize("method,path", [("get", "/api/admin/posts"), ("get", "/api/admin/comments"), ("get", "/api/users"),
                                             ("delete", "/api/admin/posts/x"), ("delete", "/api/admin/comments/x")])
    def test_member_403(self, member_h, method, path):
        r = getattr(requests, method)(f"{BASE_URL}{path}", headers=member_h)
        assert r.status_code == 403

    def test_member_cannot_create(self, member_h):
        r = requests.post(f"{BASE_URL}/api/admin/posts", headers=member_h, json={"type": "noticia", "title": "TEST_x"})
        assert r.status_code == 403


# ---- Admin CRUD ----
class TestAdmin:
    def test_crud(self, admin_h, created):
        r = requests.post(f"{BASE_URL}/api/admin/posts", headers=admin_h, json={
            "type": "reel", "title": "TEST_reel", "video_url": "https://www.youtube.com/shorts/aqz-KE-bpKQ", "published": False})
        assert r.status_code == 200
        p = r.json()
        created.append(p["id"])
        # unpublished hidden from public, visible in admin
        assert requests.get(f"{BASE_URL}/api/posts/{p['id']}").status_code == 404
        assert any(x["id"] == p["id"] for x in requests.get(f"{BASE_URL}/api/admin/posts", headers=admin_h).json())
        r = requests.put(f"{BASE_URL}/api/admin/posts/{p['id']}", headers=admin_h, json={
            "type": "reel", "title": "TEST_reel_upd", "published": True})
        assert r.status_code == 200 and r.json()["title"] == "TEST_reel_upd"
        assert requests.get(f"{BASE_URL}/api/posts/{p['id']}").json()["title"] == "TEST_reel_upd"
        assert requests.delete(f"{BASE_URL}/api/admin/posts/{p['id']}", headers=admin_h).status_code == 200
        assert requests.get(f"{BASE_URL}/api/posts/{p['id']}").status_code == 404
        assert requests.delete(f"{BASE_URL}/api/admin/posts/{p['id']}", headers=admin_h).status_code == 404

    def test_put_404(self, admin_h):
        r = requests.put(f"{BASE_URL}/api/admin/posts/nope", headers=admin_h, json={"type": "noticia", "title": "x"})
        assert r.status_code == 404

    def test_create_invalid(self, admin_h):
        assert requests.post(f"{BASE_URL}/api/admin/posts", headers=admin_h, json={"type": "bad", "title": "x"}).status_code == 422

    def test_create_empty_title_rejected(self, admin_h, created):
        r = requests.post(f"{BASE_URL}/api/admin/posts", headers=admin_h, json={"type": "noticia", "title": ""})
        if r.status_code == 200:
            created.append(r.json()["id"])
        assert r.status_code == 422, "empty title accepted by API"

    def test_admin_comments_list_delete(self, admin_h, test_post):
        pid = test_post["id"]
        c = requests.post(f"{BASE_URL}/api/posts/{pid}/comments", json={"name": "TEST_del", "content": "apagar"}).json()
        before = requests.get(f"{BASE_URL}/api/posts/{pid}").json()["comments_count"]
        lst = requests.get(f"{BASE_URL}/api/admin/comments", headers=admin_h).json()
        row = next(x for x in lst if x["id"] == c["id"])
        assert row["post_title"] == test_post["title"]
        assert requests.delete(f"{BASE_URL}/api/admin/comments/{c['id']}", headers=admin_h).status_code == 200
        assert requests.get(f"{BASE_URL}/api/posts/{pid}").json()["comments_count"] == before - 1
        assert requests.delete(f"{BASE_URL}/api/admin/comments/{c['id']}", headers=admin_h).status_code == 404

    def test_upload_image_and_fetch(self, admin_h):
        png = bytes.fromhex("89504e470d0a1a0a0000000d4948445200000001000000010806000000"
                            "1f15c4890000000d49444154789c63000100000500010d0a2db40000000049454e44ae426082")
        r = requests.post(f"{BASE_URL}/api/admin/upload", headers=admin_h,
                          files={"file": ("TEST_pixel.png", png, "image/png")}, timeout=120)
        assert r.status_code == 200, r.text
        url = r.json()["url"]
        assert url.startswith("/api/files/")
        g = requests.get(f"{BASE_URL}{url}", timeout=60)
        assert g.status_code == 200 and g.content == png
        assert g.headers["content-type"].startswith("image/png")

    def test_upload_rejects_non_media(self, admin_h):
        r = requests.post(f"{BASE_URL}/api/admin/upload", headers=admin_h,
                          files={"file": ("TEST.txt", b"hello", "text/plain")})
        assert r.status_code == 400

    def test_files_404(self):
        assert requests.get(f"{BASE_URL}/api/files/paty-investiga/uploads/nope.png").status_code == 404


# ---- Users / roles ----
class TestUsers:
    def test_list_users(self, admin_h):
        r = requests.get(f"{BASE_URL}/api/users", headers=admin_h)
        assert r.status_code == 200
        d = r.json()
        assert set(d["roles"]) == {"admin", "member"}
        assert any(u["user_id"] == ADMIN_UID and u["role"] == "admin" for u in d["users"])

    def test_role_member_to_member_and_invalid(self, admin_h):
        r = requests.patch(f"{BASE_URL}/api/users/{MEMBER_UID}/role", headers=admin_h, json={"role": "member"})
        assert r.status_code == 200 and r.json()["role"] == "member"
        assert requests.patch(f"{BASE_URL}/api/users/{MEMBER_UID}/role", headers=admin_h, json={"role": "god"}).status_code == 403
        assert requests.patch(f"{BASE_URL}/api/users/nobody/role", headers=admin_h, json={"role": "member"}).status_code == 404

    def test_last_admin_demote_409(self, admin_h):
        users = requests.get(f"{BASE_URL}/api/users", headers=admin_h).json()["users"]
        admins = [u for u in users if u["role"] == "admin"]
        if len(admins) != 1:
            pytest.skip("more than one admin present")
        r = requests.patch(f"{BASE_URL}/api/users/{ADMIN_UID}/role", headers=admin_h, json={"role": "member"})
        assert r.status_code == 409
        assert requests.get(f"{BASE_URL}/api/me", headers=admin_h).json()["role"] == "admin"

    def test_member_cannot_change_roles(self, member_h):
        r = requests.patch(f"{BASE_URL}/api/users/{MEMBER_UID}/role", headers=member_h, json={"role": "admin"})
        assert r.status_code == 403

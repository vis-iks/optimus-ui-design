from urllib.parse import parse_qs, urlparse

import pytest

from app.routers import auth as auth_router


@pytest.fixture
def fake_github(monkeypatch):
    async def fake_exchange_code(code: str) -> str:
        assert code == "good-code"
        return "gh-access-token"

    async def fake_fetch_user(token: str) -> dict:
        assert token == "gh-access-token"
        return {"id": 4242, "login": "octo-admin", "avatar_url": "https://avatars/octo.png"}

    monkeypatch.setattr(auth_router, "exchange_code", fake_exchange_code)
    monkeypatch.setattr(auth_router, "fetch_user", fake_fetch_user)


def _token_from_redirect(location: str) -> str:
    fragment = urlparse(location).fragment
    return parse_qs(fragment)["token"][0]


def test_login_redirects_to_github(client):
    resp = client.get("/api/auth/github/login", follow_redirects=False)
    # GitHub OAuth not configured in tests -> 503
    assert resp.status_code == 503


def test_dev_login_mints_a_local_session(client, monkeypatch):
    monkeypatch.setattr(auth_router.settings, "dev_login_enabled", True)
    resp = client.post("/api/auth/dev-login")
    assert resp.status_code == 200

    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {resp.json()['token']}"})
    assert me.status_code == 200
    assert me.json()["github_login"] == "local-dev"


def test_callback_mints_working_session(client, monkeypatch, fake_github):
    from app.routers import auth as ar

    state = ar.mint_state_token("http://localhost:4200/gallery", "nonce")
    resp = client.get(
        "/api/auth/github/callback",
        params={"code": "good-code", "state": state},
        follow_redirects=False,
    )
    assert resp.status_code == 307
    token = _token_from_redirect(resp.headers["location"])

    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    body = me.json()
    assert body["github_login"] == "octo-admin"
    assert body["is_admin"] is True  # promoted via ADMIN_GITHUB_LOGINS


def test_callback_with_error_redirects_to_spa(client):
    resp = client.get(
        "/api/auth/github/callback", params={"error": "access_denied"}, follow_redirects=False
    )
    assert resp.status_code == 307
    assert "error=github_denied" in resp.headers["location"]


def test_me_rejects_missing_and_bad_tokens(client):
    assert client.get("/api/auth/me").status_code == 401
    assert client.get(
        "/api/auth/me", headers={"Authorization": "Bearer not-a-jwt"}
    ).status_code == 401

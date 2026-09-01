from tests.conftest import theme_payload


def test_publish_and_list_theme(client, user_factory):
    _, headers = user_factory("alice")
    resp = client.post("/api/themes", json=theme_payload(), headers=headers)
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["name"] == "Ocean"
    assert body["slug"] == "ocean"
    assert body["author"]["github_login"] == "alice"
    assert body["preset"]["primitive"]["blue"]["500"] == "#3b82f6"

    listing = client.get("/api/themes").json()
    assert listing["total"] == 1
    assert listing["items"][0]["id"] == body["id"]


def test_publish_requires_auth(client):
    assert client.post("/api/themes", json=theme_payload()).status_code == 401


def test_get_theme_increments_views(client, user_factory):
    _, headers = user_factory("alice")
    theme_id = client.post("/api/themes", json=theme_payload(), headers=headers).json()["id"]
    client.get(f"/api/themes/{theme_id}")
    second = client.get(f"/api/themes/{theme_id}").json()
    assert second["view_count"] == 2


def test_preset_size_cap(client, user_factory):
    _, headers = user_factory("alice")
    huge = {"primitive": {"x": "y" * 5000}}
    resp = client.post("/api/themes", json=theme_payload(preset=huge), headers=headers)
    assert resp.status_code == 413


def test_user_theme_quota(client, user_factory):
    _, headers = user_factory("alice")
    for i in range(5):  # USER_THEME_QUOTA=5 in test env
        assert client.post(
            "/api/themes", json=theme_payload(name=f"T{i}"), headers=headers
        ).status_code == 201
    resp = client.post("/api/themes", json=theme_payload(name="overflow"), headers=headers)
    assert resp.status_code == 429


def test_search_sort_and_base_filter(client, user_factory):
    _, headers = user_factory("alice")
    client.post("/api/themes", json=theme_payload(name="Sunset", base_preset="Lara"), headers=headers)
    client.post("/api/themes", json=theme_payload(name="Ocean", base_preset="Aura"), headers=headers)

    assert client.get("/api/themes", params={"search": "sun"}).json()["total"] == 1
    assert client.get("/api/themes", params={"base": "Aura"}).json()["total"] == 1
    assert client.get("/api/themes", params={"base": "all"}).json()["total"] == 2

    paged = client.get("/api/themes", params={"limit": 1, "offset": 1}).json()
    assert len(paged["items"]) == 1 and paged["total"] == 2


def test_owner_can_update_and_delete(client, user_factory):
    _, headers = user_factory("alice")
    theme_id = client.post("/api/themes", json=theme_payload(), headers=headers).json()["id"]

    patched = client.patch(
        f"/api/themes/{theme_id}", json={"name": "Deep Ocean"}, headers=headers
    )
    assert patched.status_code == 200 and patched.json()["name"] == "Deep Ocean"

    assert client.delete(f"/api/themes/{theme_id}", headers=headers).status_code == 204
    assert client.get(f"/api/themes/{theme_id}").status_code == 404


def test_invalid_base_preset_falls_back_to_custom(client, user_factory):
    _, headers = user_factory("alice")
    body = client.post(
        "/api/themes", json=theme_payload(base_preset="Bootstrap"), headers=headers
    ).json()
    assert body["base_preset"] == "custom"

from tests.conftest import theme_payload


def test_non_owner_cannot_modify(client, user_factory):
    _, alice = user_factory("alice")
    _, bob = user_factory("bob")
    theme_id = client.post("/api/themes", json=theme_payload(), headers=alice).json()["id"]

    assert client.patch(
        f"/api/themes/{theme_id}", json={"name": "hijack"}, headers=bob
    ).status_code == 403
    assert client.delete(f"/api/themes/{theme_id}", headers=bob).status_code == 403


def test_admin_can_modify_any_theme(client, user_factory):
    _, alice = user_factory("alice")
    _, admin = user_factory("octo-admin", is_admin=True)
    theme_id = client.post("/api/themes", json=theme_payload(), headers=alice).json()["id"]

    assert client.patch(
        f"/api/themes/{theme_id}", json={"name": "Moderated"}, headers=admin
    ).status_code == 200
    assert client.delete(f"/api/themes/{theme_id}", headers=admin).status_code == 204


def test_admin_endpoints_require_admin(client, user_factory):
    _, plain = user_factory("alice")
    assert client.get("/api/admin/reports").status_code == 401
    assert client.get("/api/admin/reports", headers=plain).status_code == 403

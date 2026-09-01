from tests.conftest import theme_payload


def _publish(client, headers, **kw):
    return client.post("/api/themes", json=theme_payload(**kw), headers=headers).json()["id"]


def test_report_hides_theme_at_threshold(client, user_factory):
    _, author = user_factory("author")
    theme_id = _publish(client, author)

    for i in range(2):
        _, reporter = user_factory(f"reporter{i}")
        assert client.post(
            f"/api/themes/{theme_id}/report", json={"reason": "spam"}, headers=reporter
        ).status_code == 204
    # still visible after 2 reports
    assert client.get(f"/api/themes/{theme_id}").status_code == 200

    _, third = user_factory("reporter2")
    client.post(f"/api/themes/{theme_id}/report", json={"reason": "offensive"}, headers=third)
    # threshold is 3 -> now hidden
    assert client.get(f"/api/themes/{theme_id}").status_code == 404
    assert client.get("/api/themes").json()["total"] == 0


def test_one_report_per_user(client, user_factory):
    _, author = user_factory("author")
    theme_id = _publish(client, author)
    _, reporter = user_factory("reporter")

    client.post(f"/api/themes/{theme_id}/report", json={"reason": "spam"}, headers=reporter)
    client.post(f"/api/themes/{theme_id}/report", json={"reason": "broken"}, headers=reporter)

    _, admin = user_factory("octo-admin", is_admin=True)
    reports = client.get("/api/admin/reports", headers=admin).json()
    assert len(reports) == 1
    assert reports[0]["reason"] == "broken"  # upserted


def test_cannot_report_own_theme(client, user_factory):
    _, author = user_factory("author")
    theme_id = _publish(client, author)
    resp = client.post(f"/api/themes/{theme_id}/report", json={"reason": "spam"}, headers=author)
    assert resp.status_code == 400


def test_admin_resolve_dismiss_unhides(client, user_factory):
    _, author = user_factory("author")
    theme_id = _publish(client, author)
    for i in range(3):
        _, reporter = user_factory(f"r{i}")
        client.post(f"/api/themes/{theme_id}/report", json={"reason": "spam"}, headers=reporter)

    _, admin = user_factory("octo-admin", is_admin=True)
    report_id = client.get("/api/admin/reports", headers=admin).json()[0]["id"]
    assert client.post(
        f"/api/admin/reports/{report_id}/resolve", json={"action": "dismiss"}, headers=admin
    ).status_code == 204

    assert client.get(f"/api/themes/{theme_id}").status_code == 200
    assert client.get("/api/admin/reports", headers=admin).json() == []


def test_admin_resolve_delete_removes_theme(client, user_factory):
    _, author = user_factory("author")
    theme_id = _publish(client, author)
    _, reporter = user_factory("reporter")
    client.post(f"/api/themes/{theme_id}/report", json={"reason": "copyright"}, headers=reporter)

    _, admin = user_factory("octo-admin", is_admin=True)
    report_id = client.get("/api/admin/reports", headers=admin).json()[0]["id"]
    client.post(
        f"/api/admin/reports/{report_id}/resolve", json={"action": "delete"}, headers=admin
    )
    assert client.get(f"/api/themes/{theme_id}").status_code == 404


def test_admin_visibility_toggle(client, user_factory):
    _, author = user_factory("author")
    theme_id = _publish(client, author)
    _, admin = user_factory("octo-admin", is_admin=True)

    hidden = client.post(
        f"/api/admin/themes/{theme_id}/visibility", json={"is_hidden": True}, headers=admin
    )
    assert hidden.status_code == 200 and hidden.json()["id"] == theme_id
    assert client.get(f"/api/themes/{theme_id}").status_code == 404

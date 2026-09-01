from tests.conftest import theme_payload


def _publish(client, headers, name, parent_id=None):
    body = theme_payload(name=name)
    if parent_id:
        body["parent_id"] = parent_id
    resp = client.post("/api/themes", json=body, headers=headers)
    assert resp.status_code == 201, resp.text
    return resp.json()


def test_fork_records_parent_and_bumps_fork_count(client, user_factory):
    _, alice = user_factory("alice")
    _, bob = user_factory("bob")

    root = _publish(client, alice, "Root")
    fork = _publish(client, bob, "Bobs take", parent_id=root["id"])

    assert fork["parent_id"] == root["id"]
    assert fork["parent"]["name"] == "Root"
    assert fork["parent"]["author"]["github_login"] == "alice"

    refreshed_root = client.get(f"/api/themes/{root['id']}").json()
    assert refreshed_root["fork_count"] == 1
    assert refreshed_root["parent"] is None


def test_fork_of_missing_or_hidden_parent_is_rejected(client, user_factory):
    _, alice = user_factory("alice")
    assert (
        client.post(
            "/api/themes", json=theme_payload(name="orphan", parent_id="deadbeef"), headers=alice
        ).status_code
        == 404
    )


def test_family_returns_the_whole_tree_with_root_and_focus(client, user_factory):
    _, alice = user_factory("alice")
    _, bob = user_factory("bob")
    _, cara = user_factory("cara")

    root = _publish(client, alice, "Root")
    child_a = _publish(client, bob, "Child A", parent_id=root["id"])
    child_b = _publish(client, cara, "Child B", parent_id=root["id"])
    grandchild = _publish(client, alice, "Grandchild", parent_id=child_a["id"])

    family = client.get(f"/api/themes/{grandchild['id']}/family").json()

    assert family["root_id"] == root["id"]
    assert family["focus_id"] == grandchild["id"]
    ids = {n["id"] for n in family["nodes"]}
    assert ids == {root["id"], child_a["id"], child_b["id"], grandchild["id"]}

    by_id = {n["id"]: n for n in family["nodes"]}
    assert by_id[root["id"]]["parent_id"] is None
    assert by_id[grandchild["id"]]["parent_id"] == child_a["id"]
    assert by_id[root["id"]]["fork_count"] == 2


def test_family_from_the_root_still_includes_descendants(client, user_factory):
    _, alice = user_factory("alice")
    _, bob = user_factory("bob")
    root = _publish(client, alice, "Root")
    _publish(client, bob, "Fork", parent_id=root["id"])

    family = client.get(f"/api/themes/{root['id']}/family").json()
    assert len(family["nodes"]) == 2
    assert family["root_id"] == root["id"] == family["focus_id"]


def test_hidden_descendant_is_excluded_from_family(client, user_factory):
    _, alice = user_factory("alice")
    _, bob = user_factory("bob")
    _, admin = user_factory("octo-admin", is_admin=True)

    root = _publish(client, alice, "Root")
    fork = _publish(client, bob, "Fork", parent_id=root["id"])
    client.post(
        f"/api/admin/themes/{fork['id']}/visibility", json={"is_hidden": True}, headers=admin
    )

    family = client.get(f"/api/themes/{root['id']}/family").json()
    assert {n["id"] for n in family["nodes"]} == {root["id"]}

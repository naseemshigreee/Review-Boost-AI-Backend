from app.guardrails import sanitize_comment
from tests.conftest import sample_business


def test_empty_comment():
    assert sanitize_comment("") == ("", [])
    assert sanitize_comment("   ") == ("", [])


def test_contact_details_stripped_with_warning():
    text, warnings = sanitize_comment("Great tea, call +92 300 1234567 or mail a@b.com")
    assert "1234567" not in text and "a@b.com" not in text and "Great tea" in text
    assert warnings == ["Links and contact details were removed from your comment."]


def _setup(client, auth):
    biz = client.post("/api/admin/businesses", json=sample_business(), headers=auth).json()
    pub = client.get(f"/api/public/business/{biz['id']}").json()
    return biz, pub


def test_copy_event_counted_twice(client, auth):
    biz, _ = _setup(client, auth)
    for _ in range(2):
        assert client.post(f"/api/public/business/{biz['id']}/events",
                           json={"event": "copy_and_open_clicked"}).status_code == 204
    assert client.get("/api/admin/dashboard", headers=auth).json()["copy_and_open_clicks"] == 2


def test_regenerate_returns_draft(client, auth):
    biz, pub = _setup(client, auth)
    answers = [{"category_id": pub["categories"][0]["id"], "rating": "Good"},
               {"category_id": pub["categories"][1]["id"], "rating": "Average"}]
    r = client.post(f"/api/public/business/{biz['id']}/generate-review",
                    json={"answers": answers, "comment": "", "regenerate": True})
    assert r.status_code == 200 and r.json()["review"]

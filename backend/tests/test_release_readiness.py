import time


def test_admin_login_success_and_failure(client):
    failed_login = client.post(
        "/api/admin/login",
        json={"username": "admin", "password": "wrongpass"},
    )
    assert failed_login.status_code == 401

    successful_login = client.post(
        "/api/admin/login",
        json={"username": "admin", "password": "admin123"},
    )
    assert successful_login.status_code == 200

    payload = successful_login.json()
    assert payload["access_token"]
    assert payload["token_type"] == "bearer"
    assert payload["user_info"]["username"] == "admin"


def test_admin_dashboard_configuration_and_export(client, auth_headers):
    dashboard_response = client.get("/api/admin/dashboard", headers=auth_headers)
    assert dashboard_response.status_code == 200, dashboard_response.text

    dashboard_payload = dashboard_response.json()
    assert "total_audits" in dashboard_payload
    assert "recent_activities" in dashboard_payload

    get_config_response = client.get("/api/admin/configuration", headers=auth_headers)
    assert get_config_response.status_code == 200
    assert "ai_model" in get_config_response.json()

    configuration_payload = {
        "ai_model": "gpt-4",
        "analysis_depth": "comprehensive",
        "include_roi_analysis": True,
        "include_risk_assessment": True,
        "include_implementation_roadmap": True,
        "pdf_template": "default",
        "auto_generate_pdf": True,
        "notification_settings": {
            "email_on_completion": True,
            "new_submissions": True,
            "weekly_reports": False,
        },
        "custom_prompts": {"system_additions": "Focus on measurable outcomes."},
    }

    put_config_response = client.put(
        "/api/admin/configuration",
        json=configuration_payload,
        headers=auth_headers,
    )
    assert put_config_response.status_code == 200, put_config_response.text

    updated_config_response = client.get("/api/admin/configuration", headers=auth_headers)
    assert updated_config_response.status_code == 200
    updated_config = updated_config_response.json()
    assert updated_config["ai_model"] == "gpt-4"
    assert updated_config["analysis_depth"] == "comprehensive"
    assert updated_config["custom_prompts"]["system_additions"] == "Focus on measurable outcomes."

    export_response = client.get("/api/admin/export?format=csv", headers=auth_headers)
    assert export_response.status_code == 200, export_response.text
    assert "text/csv" in export_response.headers.get("content-type", "")
    assert "Company Name" in export_response.text


def test_contact_submit_with_marketing_consent(client):
    contact_payload = {
        "name": "Release QA",
        "email": "qa@example.com",
        "phone": "+1-555-1234",
        "company": "XTeam QA",
        "position": "QA Engineer",
        "inquiry_type": "consultation",
        "subject": "Need automation help",
        "message": "We need a complete release readiness consultation this week.",
        "budget_range": "10k-50k",
        "timeline": "1-3months",
        "preferred_contact_method": "email",
        "marketing_consent": True,
        "source": "website",
    }

    submit_response = client.post("/api/contact/contact-submit", json=contact_payload)
    assert submit_response.status_code == 200, submit_response.text

    inquiry_id = submit_response.json()["inquiry_id"]
    inquiry_response = client.get(f"/api/contact/inquiry/{inquiry_id}")
    assert inquiry_response.status_code == 200, inquiry_response.text
    assert inquiry_response.json()["name"] == "Release QA"


def test_audit_submit_results_and_admin_delete(client, auth_headers):
    audit_payload = {
        "company_name": "Release Candidate Inc",
        "industry": "SaaS",
        "company_size": "medium",
        "current_processes": ["Manual reporting", "Email approvals"],
        "pain_points": ["Slow reporting", "Human error"],
        "automation_goals": ["Automate reporting", "Reduce manual effort"],
        "budget_range": "50k-100k",
        "timeline": "1-3months",
        "contact_email": "ops@release-candidate.test",
        "contact_name": "Release Owner",
        "contact_phone": "+1-555-7777",
    }

    submit_response = client.post("/api/audit/submit", json=audit_payload)
    assert submit_response.status_code == 200, submit_response.text

    audit_id = submit_response.json()["audit_id"]
    assert audit_id

    final_status = None
    for _ in range(30):
        status_response = client.get(f"/api/audit/status/{audit_id}")
        assert status_response.status_code == 200, status_response.text

        final_status = status_response.json()["status"]
        if final_status in {"completed", "failed"}:
            break
        time.sleep(0.2)

    assert final_status == "completed"

    results_response = client.get(f"/api/audit/results/{audit_id}")
    assert results_response.status_code == 200, results_response.text
    results_payload = results_response.json()
    assert results_payload["audit_id"] == audit_id
    assert isinstance(results_payload["opportunities"], list)
    assert len(results_payload["opportunities"]) > 0

    delete_response = client.delete(f"/api/admin/submissions/{audit_id}", headers=auth_headers)
    assert delete_response.status_code == 200, delete_response.text

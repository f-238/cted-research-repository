import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch


_db_file = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
_db_file.close()
os.environ["DATABASE_URL"] = f"sqlite:///{_db_file.name}"
os.environ["JWT_SECRET"] = "test-only-secret"
os.environ["ADMIN_EMAIL"] = "security-admin@example.com"
os.environ["ADMIN_PASSWORD"] = "test-admin-password"

from fastapi.testclient import TestClient

from app.core.database import engine
from app.main import app
from app.models.entities import User
from app.services.storage import StoredUpload


class SecurityFlowTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    @classmethod
    def tearDownClass(cls):
        cls.client.close()
        engine.dispose()
        Path(_db_file.name).unlink(missing_ok=True)

    def setUp(self):
        self._temp_uploads = []
        self.patches = [
            patch("app.api.routes.store_upload", side_effect=self._fake_upload),
            patch("app.api.routes.store_profile_image", return_value="1/profile.webp"),
            patch("app.api.routes.signed_url", return_value="https://signed.example.test/file"),
            patch("app.api.routes.delete_file"),
            patch("app.api.routes.check_document", return_value=object()),
            patch("app.api.routes.serialize_check", return_value=(True, "[]", "[]", "{}")),
        ]
        for item in self.patches:
            item.start()

    def tearDown(self):
        for item in reversed(self.patches):
            item.stop()
        for path in self._temp_uploads:
            Path(path).unlink(missing_ok=True)

    def _fake_upload(self, upload, folder, allowed, max_size_mb=None):
        handle = tempfile.NamedTemporaryFile(suffix=".pdf", delete=False)
        handle.write(b"test")
        handle.close()
        self._temp_uploads.append(handle.name)
        return StoredUpload(
            storage_key=f"{folder}/test.pdf",
            original_filename=upload.filename or "test.pdf",
            file_type="pdf",
            mime_type="application/pdf",
            file_size=4,
            temp_path=handle.name,
        )

    def _login(self, email, password):
        response = self.client.post("/api/auth/login", data={"email": email, "password": password})
        self.assertEqual(response.status_code, 200, response.text)
        return {"Authorization": f"Bearer {response.json()['access_token']}"}

    def test_end_to_end_permissions_and_features(self):
        admin_headers = self._login("security-admin@example.com", "test-admin-password")

        registration = self.client.post("/api/auth/register", json={
            "full_name": "Student Tester", "email": "student@example.com",
            "password": "student-password", "role": "student", "course_id": 1, "section": "A",
        })
        self.assertEqual(registration.status_code, 200, registration.text)
        student_id = registration.json()["id"]
        self.assertEqual(self.client.post("/api/auth/login", data={"email": "student@example.com", "password": "student-password"}).status_code, 403)

        approval = self.client.patch(
            f"/api/users/{student_id}", headers=admin_headers,
            data={"account_status": "approved", "is_active": "true"},
        )
        self.assertEqual(approval.status_code, 200, approval.text)
        student_headers = self._login("student@example.com", "student-password")

        faculty_registration = self.client.post("/api/auth/register", json={
            "full_name": "Faculty Tester", "email": "faculty@example.com",
            "password": "faculty-password", "role": "faculty", "course_id": 1,
        })
        faculty_id = faculty_registration.json()["id"]
        self.client.patch(
            f"/api/users/{faculty_id}", headers=admin_headers,
            data={"account_status": "approved", "is_active": "true"},
        )
        faculty_headers = self._login("faculty@example.com", "faculty-password")

        # Public registration dependencies stay behind FastAPI; protected data does not.
        self.assertEqual(self.client.get("/api/courses").status_code, 200)
        self.assertEqual(self.client.get("/api/settings/public").status_code, 200)
        self.assertEqual(self.client.get("/api/templates").status_code, 401)
        self.assertEqual(self.client.get("/api/templates", headers=student_headers).status_code, 200)
        self.assertEqual(self.client.get("/api/programs/1/years", headers=student_headers).status_code, 403)
        self.assertEqual(self.client.get("/api/reports/trends", headers=faculty_headers).status_code, 200)
        self.assertEqual(self.client.get("/api/users", headers=faculty_headers).status_code, 403)
        self.assertEqual(self.client.post(
            "/api/users/me/profile-image", headers=student_headers,
            files={"file": ("avatar.webp", b"test", "image/webp")},
        ).status_code, 200)

        template = self.client.post(
            "/api/templates", headers=admin_headers,
            data={"title": "Security Template", "instructions": "Use this securely."},
            files={"file": ("template.pdf", b"test", "application/pdf")},
        )
        self.assertEqual(template.status_code, 200, template.text)
        self.assertEqual(self.client.get(
            f"/api/templates/{template.json()['id']}/download", headers=student_headers,
        ).status_code, 200)

        submission = self.client.post("/api/submissions", headers=student_headers, data={
            "submission_type": "research", "title": "RLS Test Paper", "authors": "Student Tester",
            "course_id": "1", "section": "A", "adviser": "Faculty Tester",
            "school_year": "2026-2027", "submission_year": "2026", "keywords": "security",
            "abstract": "Security test abstract",
        }, files={"file": ("paper.pdf", b"test", "application/pdf")})
        self.assertEqual(submission.status_code, 200, submission.text)
        submission_id = submission.json()["id"]

        pending = self.client.get("/api/submissions?status=Pending%20Review", headers=admin_headers)
        self.assertTrue(any(row["id"] == submission_id for row in pending.json()))
        reviewed = self.client.post(
            f"/api/submissions/{submission_id}/review", headers=admin_headers,
            json={"status": "Approved", "remarks": "Approved in security test."},
        )
        self.assertEqual(reviewed.status_code, 200, reviewed.text)
        self.assertEqual(self.client.get(f"/api/submissions/{submission_id}/download", headers=student_headers).status_code, 200)

        notifications = self.client.get("/api/notifications", headers=student_headers)
        self.assertEqual(notifications.status_code, 200)
        self.assertTrue(any("Approved" in row["title"] for row in notifications.json()))

        accomplishment = self.client.post("/api/accomplishments", headers=admin_headers, data={
            "report_type": "presentation", "title": "Security Presentation", "researcher": "Researcher",
            "category": "Research", "organization": "CTED", "event_date": "2026-08-20",
            "school_year": "2026-2027", "status": "Approved",
        }, files={"file": ("evidence.pdf", b"test", "application/pdf")})
        self.assertEqual(accomplishment.status_code, 200, accomplishment.text)
        self.assertEqual(self.client.get("/api/accomplishments?report_type=presentation", headers=admin_headers).status_code, 200)
        self.assertEqual(self.client.get(f"/api/accomplishments/{accomplishment.json()['id']}/download", headers=admin_headers).status_code, 200)

        paper = self.client.post("/api/completed-papers", headers=admin_headers, data={
            "title": "Completed Security Paper", "authors": "Student Tester", "adviser": "Faculty Tester",
            "program_id": "1", "school_year": "2026-2027", "submission_year": "2026",
            "completion_date": "2026-08-20", "abstract": "Completed", "keywords": "security",
            "status": "Completed", "owner_id": str(student_id),
        }, files={"file": ("completed.pdf", b"test", "application/pdf")})
        self.assertEqual(paper.status_code, 200, paper.text)
        self.assertEqual(self.client.get("/api/completed-papers", headers=student_headers).status_code, 200)
        self.assertEqual(self.client.get(f"/api/completed-papers/{paper.json()['id']}/download", headers=student_headers).status_code, 200)

        self.assertEqual(self.client.get("/api/users", headers=student_headers).status_code, 403)
        self.assertEqual(self.client.get("/api/users", headers=admin_headers).status_code, 200)
        self.assertEqual(self.client.get("/api/settings", headers=student_headers).status_code, 403)
        self.assertEqual(self.client.get("/api/settings", headers=admin_headers).status_code, 200)
        self.assertEqual(self.client.get("/api/programs/1/years", headers=admin_headers).status_code, 200)


if __name__ == "__main__":
    unittest.main()

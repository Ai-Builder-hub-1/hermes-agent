from __future__ import annotations

import json

from hermes_cli.project_plan_index import build_project_plan_index


def test_project_plan_index_scans_plan_docs_and_categorizes_remaining_items(tmp_path):
    project = tmp_path / "media-engine"
    docs = project / "docs"
    docs.mkdir(parents=True)
    (docs / "business-engineering-readiness-plan.md").write_text(
        "\n".join(
            [
                "# Business Engineering Readiness Plan",
                "",
                "Overall readiness: 75%",
                "",
                "## Provider Integrations",
                "- [x] Build provider balance schema",
                "- [ ] Connect OpenAI billing API credential flow",
                "- [ ] Configure GitHub production secret verification",
                "- [~] Decide Google Cloud billing owner",
            ]
        ),
        encoding="utf-8",
    )
    registry = tmp_path / "hermes.dashboards.json"
    registry.write_text(
        json.dumps(
            {
                "dashboards": {
                    "media-engine.ops": {
                        "projectPath": str(project),
                        "url": "http://127.0.0.1:3100/",
                        "healthUrl": "http://127.0.0.1:3100/api/status",
                    }
                }
            }
        ),
        encoding="utf-8",
    )

    index = build_project_plan_index(tmp_path, registry)

    assert index["totals"]["projects"] == 1
    assert index["totals"]["plans"] == 1
    assert index["totals"]["rawDocuments"] == 1
    assert index["totals"]["openItems"] == 3
    assert index["totals"]["rawOpenItems"] == 3
    assert index["totals"]["integrationItems"] == 1
    assert index["totals"]["productionItems"] == 1
    assert index["totals"]["decisionItems"] == 1
    project_summary = index["projects"][0]
    assert project_summary["dashboardId"] == "media-engine.ops"
    assert project_summary["documentCounts"] == {"actual": 1, "reference": 0, "template": 0, "ignored": 0}
    assert project_summary["completionPercent"] == 25
    assert project_summary["plans"][0]["title"] == "Business Engineering Readiness Plan"
    assert project_summary["plans"][0]["documentKind"] == "actual"
    assert project_summary["remaining"]["integration"][0]["sourcePath"] == "docs/business-engineering-readiness-plan.md"
    assert project_summary["remaining"]["integration"][0]["line"] == 7
    assert project_summary["planWork"][0]["openItems"] == 3
    assert len(project_summary["workItems"]) == 3
    assert index["workQueue"][0]["id"]
    assert index["workQueue"][0]["project"] == "media-engine"
    assert index["workQueue"][0]["planPath"] == "docs/business-engineering-readiness-plan.md"


def test_project_plan_index_discovers_workspace_project_without_registry(tmp_path):
    project = tmp_path / "rinseables-os"
    plans = project / "plans"
    plans.mkdir(parents=True)
    (plans / "staged-build-plan.md").write_text(
        "\n".join(
            [
                "# Staged Build Plan",
                "- [ ] Build business unit dashboard",
            ]
        ),
        encoding="utf-8",
    )

    index = build_project_plan_index(tmp_path, tmp_path / "missing.json")

    assert index["totals"]["projects"] == 1
    assert index["projects"][0]["name"] == "rinseables-os"
    assert index["projects"][0]["plans"][0]["relativePath"] == "plans/staged-build-plan.md"


def test_project_plan_index_separates_reference_template_and_ignored_docs(tmp_path):
    project = tmp_path / "nous-hermes-agent"
    (project / "docs" / "design").mkdir(parents=True)
    (project / "docs" / "templates").mkdir(parents=True)
    (project / "plugins" / "memory").mkdir(parents=True)
    (project / "docs" / "design" / "v81-build-plan.md").write_text(
        "# V81 Build Plan\n- [ ] Build actual command center\n",
        encoding="utf-8",
    )
    (project / "docs" / "templates" / "business-unit-readiness-plan.md").write_text(
        "# Business Unit Readiness Plan Template\n- [ ] Replace this template item\n",
        encoding="utf-8",
    )
    (project / "plugins" / "memory" / "README.md").write_text(
        "# Memory Plugin\n- [ ] Plugin-local setup note\n",
        encoding="utf-8",
    )
    (project / "README.md").write_text("# General README\n", encoding="utf-8")

    index = build_project_plan_index(tmp_path, tmp_path / "missing.json")
    project_summary = index["projects"][0]

    assert index["totals"]["plans"] == 1
    assert index["totals"]["rawDocuments"] == 4
    assert index["totals"]["templateDocuments"] == 1
    assert index["totals"]["referenceDocuments"] == 1
    assert index["totals"]["ignoredDocuments"] == 1
    assert index["totals"]["openItems"] == 1
    assert index["totals"]["rawOpenItems"] == 3
    assert project_summary["documentCounts"] == {"actual": 1, "reference": 1, "template": 1, "ignored": 1}
    assert [plan["relativePath"] for plan in project_summary["plans"]] == ["docs/design/v81-build-plan.md"]
    assert [item["text"] for item in index["workQueue"]] == ["Build actual command center"]

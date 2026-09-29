import pytest


@pytest.mark.asyncio
async def test_strategy_summary_series_and_review(tmp_path, monkeypatch):
    monkeypatch.setenv("HERMES_HOME", str(tmp_path / "home"))
    monkeypatch.delenv("INVESTING_SYSTEM_API_BASE_URL", raising=False)
    monkeypatch.delenv("KHASHI_VC_API_BASE_URL", raising=False)

    from hermes_cli.trading_research import record_strategy_review, strategy_series, strategy_summary

    summary = await strategy_summary()
    assert summary["contractVersion"] == "trading-strategy-research.v1"
    assert summary["summary"]["candidates"] >= 1
    assert {"id", "sourceProject", "hypothesis", "promotionGate"}.issubset(summary["candidates"][0])
    assert len((await strategy_series("1h"))["points"]) == 6
    assert (await record_strategy_review())["ok"] is True


@pytest.mark.asyncio
async def test_backtesting_summary_series_and_review(tmp_path, monkeypatch):
    monkeypatch.setenv("HERMES_HOME", str(tmp_path / "home"))
    monkeypatch.delenv("INVESTING_SYSTEM_API_BASE_URL", raising=False)
    monkeypatch.delenv("KHASHI_VC_API_BASE_URL", raising=False)

    from hermes_cli.trading_research import backtesting_series, backtesting_summary, record_backtest_review

    summary = await backtesting_summary()
    assert summary["contractVersion"] == "trading-backtesting.v1"
    assert summary["summary"]["runs"] >= 1
    assert {"id", "strategyId", "datasetWindow", "promotionGate"}.issubset(summary["runs"][0])
    assert len((await backtesting_series("7d"))["points"]) == 7
    assert (await record_backtest_review())["ok"] is True


@pytest.mark.asyncio
async def test_evidence_ledger_series_and_review(tmp_path, monkeypatch):
    monkeypatch.setenv("HERMES_HOME", str(tmp_path / "home"))
    monkeypatch.delenv("INVESTING_SYSTEM_API_BASE_URL", raising=False)
    monkeypatch.delenv("KHASHI_VC_API_BASE_URL", raising=False)

    from hermes_cli.trading_research import evidence_ledger, evidence_series, record_evidence_review

    ledger = await evidence_ledger(20)
    assert ledger["contractVersion"] == "trading-evidence-ledger.v1"
    assert ledger["summary"]["records"] >= 1
    assert {"id", "kind", "sourceProject", "subject", "status"}.issubset(ledger["records"][0])
    assert len((await evidence_series("24h"))["points"]) == 12
    assert (await record_evidence_review())["ok"] is True

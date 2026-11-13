(() => {
  const sdk = window.__HERMES_PLUGIN_SDK__;
  if (!sdk || !window.__HERMES_PLUGINS__) return;
  const { React } = sdk;
  const h = React.createElement;
  const time = value => value ? new Date(value).toLocaleString() : "No scan recorded";
  const usd = value => Number(value).toLocaleString("en-US", {
    style: "currency", currency: "USD", maximumFractionDigits: 5,
  });
  function Reports() {
    const [existing, setExisting] = React.useState(null);
    const [data, setData] = React.useState(null);
    const [failed, setFailed] = React.useState(false);
    React.useEffect(() => {
      let active = true;
      const refresh = async () => {
        try {
          const value = await sdk.fetchJSON("/api/plugins/reports-of-reports/status");
          if (active) { setData(value); setFailed(false); }
        } catch {
          if (active) setFailed(true);
        }
      };
      sdk.fetchJSON("/api/plugins/reports-of-reports/existing").then(
        reports => { if (active) setExisting(reports); },
        () => { if (active) setExisting(false); },
      );
      refresh();
      const interval = setInterval(refresh, 60000);
      return () => { active = false; clearInterval(interval); };
    }, []);
    const ready = data?.available;
    const stale = ready && !(Date.now() - Date.parse(data.generated_at) <= 60 * 60000);
    return h("section", {className: "space-y-4"},
      h("h1", {className: "text-2xl font-semibold"}, "Reports of Reports"),
      h("h2", {className: "text-lg font-semibold"}, "Existing reports"),
      h("p", null, "Reports saved to Drive before the worker was deployed."),
      existing === null && h("p", null, "Loading existing reports…"),
      existing === false && h("p", {role: "status"}, "Existing reports could not be loaded."),
      Array.isArray(existing) && h("ul", {className: "space-y-2"}, existing.map(report =>
        h("li", {key: report.id}, h("a", {
          href: "https://docs.google.com/document/d/" + report.id + "/edit",
          target: "_blank", rel: "noopener noreferrer", className: "underline",
        }, report.title)))),
      failed && h("p", {role: "status"}, "Status could not be refreshed."),
      !data && !failed && h("p", null, "Loading research status…"),
      data && !ready && h("p", null, "No worker status snapshot has been published yet."),
      ready && h(React.Fragment, null,
        typeof data.scan_exit_code === "number" && data.scan_exit_code !== 0 && h("p", {role: "status"}, "Latest scan failed."),
        h("p", null, "Last recorded scan: ", time(data.last_scan)),
        h("p", null, "Snapshot: ", time(data.generated_at), stale ? " (stale)" : ""),
        h("p", null, "Recorded spend this month: ", usd(data.month_spend_usd)),
        h("h2", {className: "text-lg font-semibold"}, "Recent runs"),
        !data.runs.length && h("p", null, "No runs recorded."),
        h("ul", {className: "divide-y"}, data.runs.map(run => {
          const id = run.report_doc_id;
          const link = ["succeeded", "partial"].includes(run.state) &&
            typeof id === "string" && /^[A-Za-z0-9_-]{1,200}$/.test(id);
          return h("li", {key: run.id, className: "py-3"},
            h("strong", null, run.name),
            h("p", null, run.state, " · ", time(run.updated_at), " · ", usd(run.spend_usd)),
            run.error_code && h("p", null, "Issue: ", run.error_code),
            link && h("a", {href: "https://docs.google.com/document/d/" + id + "/edit",
              target: "_blank", rel: "noopener noreferrer", className: "underline"}, "Open report"));
        }))));
  }
  window.__HERMES_PLUGINS__.register("reports-of-reports", Reports);
})();

"use client";

import { useState, type ReactNode } from "react";

export type DashboardTab = {
  id: string;
  label: string;
  content: ReactNode;
  badge?: number;
};

export function DashboardTabs({tabs, initial = "overview"}: { tabs: DashboardTab[]; initial?: string }) {
  const [selected, setSelected] = useState(tabs.some((tab) => tab.id === initial) ? initial : tabs[0].id);
  return (
    <div className="dashboard-tabs">
      <div className="dashboard-tab-list" role="tablist" aria-label="Admin dashboard sections">
        {tabs.map((tab) => (
          <button key={tab.id} type="button" role="tab" id={"tab-" + tab.id}
            aria-selected={selected === tab.id} aria-controls={"panel-" + tab.id}
            className={selected === tab.id ? "dashboard-tab selected" : "dashboard-tab"}
            onClick={() => setSelected(tab.id)}>
            {tab.label}{tab.badge ? <span className="dashboard-tab-count">{tab.badge}</span> : null}
          </button>
        ))}
      </div>
      {tabs.map((tab) => (
        <section key={tab.id} id={"panel-" + tab.id} role="tabpanel"
          aria-labelledby={"tab-" + tab.id} hidden={selected !== tab.id} tabIndex={0}>
          {tab.content}
        </section>
      ))}
    </div>
  );
}

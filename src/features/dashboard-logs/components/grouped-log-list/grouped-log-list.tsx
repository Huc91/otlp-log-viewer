import type {
  AttributeValue,
  NamespaceGroup,
  ScopeGroup,
  ServiceGroup,
} from "@/features/dashboard-logs/api/view-model";
import { LogTable } from "../log-table/log-table";
import styles from "./style.module.css";

interface GroupedLogListProps {
  groups: NamespaceGroup[];
}

export function GroupedLogList({ groups }: GroupedLogListProps) {
  if (groups.length === 0) {
    return <p className={styles.emptyNote}>No logs in the selected window.</p>;
  }

  return (
    <div className={styles.groupList}>
      {groups.map((group) => (
        <details key={group.namespace} className={styles.group}>
          <summary className={styles.summary}>
            <span className={styles.kicker}>namespace</span>
            <span className={styles.summaryTitle}>
              {group.namespace || "no namespace"}
            </span>
            <span className={styles.summaryMeta}>
              {group.serviceGroups.length} services · {group.rows.length} logs
            </span>
          </summary>
          <div className={styles.groupChildren}>
            {group.serviceGroups.map((serviceGroup) => (
              <ServiceSection
                key={serviceGroup.service.key}
                group={serviceGroup}
              />
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}

function ServiceSection({ group }: { group: ServiceGroup }) {
  return (
    <details className={styles.group}>
      <summary className={styles.summary}>
        <span className={styles.kicker}>service</span>
        <span className={styles.summaryTitle}>
          {group.service.name}
          {group.service.version && (
            <span className={styles.summaryMeta}> v{group.service.version}</span>
          )}
        </span>
        <span className={styles.summaryMeta}>
          {group.scopeGroups.length} scopes · {group.rows.length} logs
        </span>
      </summary>
      <div className={styles.groupChildren}>
        <AttributeList attributes={group.resourceAttributes} />
        {group.scopeGroups.map((scopeGroup) => (
          <ScopeSection key={scopeGroup.scope.key} group={scopeGroup} />
        ))}
      </div>
    </details>
  );
}

function ScopeSection({ group }: { group: ScopeGroup }) {
  return (
    <details className={styles.group}>
      <summary className={styles.summary}>
        <span className={styles.kicker}>scope</span>
        <span className={styles.summaryTitle}>
          {group.scope.name}
          {group.scope.version && (
            <span className={styles.summaryMeta}> v{group.scope.version}</span>
          )}
        </span>
        <span className={styles.summaryMeta}>{group.rows.length} logs</span>
      </summary>
      <div className={styles.groupChildren}>
        <AttributeList attributes={group.scope.attributes} />
        <LogTable rows={group.rows} />
      </div>
    </details>
  );
}

function AttributeList({
  attributes,
}: {
  attributes: Record<string, AttributeValue>;
}) {
  const entries = Object.entries(attributes);
  if (entries.length === 0) return null;

  return (
    <dl className={styles.attributeList}>
      {entries.map(([key, value]) => (
        <div key={key} className={styles.attributeRow}>
          <dt className={styles.attributeKey}>{key}</dt>
          <dd className={styles.attributeValue}>{String(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

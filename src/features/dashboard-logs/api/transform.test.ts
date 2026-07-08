import { describe, expect, it } from "vitest";
import { HOUR_IN_MS } from "@/lib/constants";
import { clusterLogsByHour, flattenLogs, groupByNamespace } from "./transform";
import type { ExportLogsServiceRequest } from "./types";
import type { LogRow } from "./view-model";

function makeRow(timestampMs: number, id = String(timestampMs)): LogRow {
  return {
    id,
    timestampMs,
    time: "00:00:00",
    severityNumber: 9,
    severityBand: "INFO",
    severityLabel: "INFO",
    body: "body",
    bodyKind: "text",
    attributes: {},
    resourceAttributes: {},
    service: { key: "ns/svc/1", namespace: "ns", name: "svc", version: "1" },
    scope: { key: "scope@1", name: "scope", version: "1", attributes: {} },
  };
}

describe("flattenLogs", () => {
  const request = {
    resourceLogs: [
      {
        resource: {
          attributes: [
            { key: "service.namespace", value: { stringValue: "shop" } },
            { key: "service.name", value: { stringValue: "checkout" } },
            { key: "service.version", value: { stringValue: "1.2.3" } },
            { key: "region", value: { stringValue: "us-east-1" } },
          ],
        },
        scopeLogs: [
          {
            scope: { name: "mock", version: "1.2.3" },
            logRecords: [
              {
                timeUnixNano: "1782925580937000000",
                severityNumber: 21,
                body: { stringValue: "boom" },
                attributes: [
                  { key: "http.status_code", value: { intValue: 500 } },
                  { key: "http.method", value: { stringValue: "PUT" } },
                  {
                    key: "process.command_args",
                    value: {
                      arrayValue: {
                        values: [{ stringValue: "node" }, { stringValue: "server.js" }],
                      },
                    },
                  },
                ],
              },
              {
                timeUnixNano: "1782925581937000000",
                severityNumber: 9,
                body: { stringValue: '{"level":"info"}' },
              },
              {
                timeUnixNano: "1782925582937000000",
                severityNumber: 13,
                body: {
                  stringValue: "Error: boom\n    at example (app.ts:1:1)",
                },
              },
            ],
          },
          {
            scope: { name: "worker" },
            logRecords: [
              {
                timeUnixNano: "1782925583937000000",
                severityNumber: 5,
                body: { stringValue: "secondary scope" },
              },
            ],
          },
        ],
      },
      {
        resource: {
          attributes: [
            { key: "service.namespace", value: { stringValue: "platform" } },
            { key: "service.name", value: { stringValue: "worker" } },
          ],
        },
        scopeLogs: [
          {
            scope: { name: "mock", version: "1.2.3" },
            logRecords: [
              {
                timeUnixNano: "1782925584937000000",
                severityNumber: 13,
                body: { stringValue: "platform log" },
              },
            ],
          },
        ],
      },
    ],
  } satisfies ExportLogsServiceRequest;

  it("converts nanosecond strings without precision loss", () => {
    const rows = flattenLogs(request);
    expect(rows.map((row) => row.timestampMs)).toEqual([
      1782925584937, 1782925583937, 1782925582937, 1782925581937,
      1782925580937,
    ]);
  });

  it("maps severityNumber to its band", () => {
    const bands = flattenLogs(request).map((row) => row.severityBand);
    expect(bands).toEqual(["WARN", "DEBUG", "WARN", "INFO", "FATAL"]);
  });

  it("extracts service identity, scope, and attribute records", () => {
    const fatalRow = flattenLogs(request)[4];
    expect(fatalRow?.service).toEqual({
      key: "shop/checkout/1.2.3",
      namespace: "shop",
      name: "checkout",
      version: "1.2.3",
    });
    expect(fatalRow?.scope.name).toBe("mock");
    expect(fatalRow?.attributes).toEqual({
      "http.status_code": 500,
      "http.method": "PUT",
      "process.command_args": "node, server.js",
    });
    expect(fatalRow?.resourceAttributes.region).toBe("us-east-1");
  });

  it("classifies bodies as json, stacktrace, or text", () => {
    const kinds = flattenLogs(request).map((row) => row.bodyKind);
    expect(kinds).toEqual(["text", "text", "stacktrace", "json", "text"]);
  });

  it("sorts rows newest-first", () => {
    const rows = flattenLogs(request);
    expect(rows[0]?.timestampMs).toBeGreaterThan(rows[4]?.timestampMs ?? 0);
  });

  it("groups by namespace, then service, then scope, busiest first", () => {
    const groups = groupByNamespace(flattenLogs(request));

    expect(groups.map((group) => group.namespace)).toEqual([
      "shop",
      "platform",
    ]);
    expect(groups[0]?.logCount).toBe(4);
    expect(groups[0]?.serviceGroups).toHaveLength(1);

    const checkout = groups[0]?.serviceGroups[0];
    expect(checkout?.service.name).toBe("checkout");
    expect(checkout?.logCount).toBe(4);
    expect(checkout?.resourceAttributes.region).toBe("us-east-1");
    expect(checkout?.scopeGroups.map((scope) => scope.scope.name)).toEqual([
      "mock",
      "worker",
    ]);
    expect(checkout?.scopeGroups[0]?.rows).toHaveLength(3);
  });
});

describe("clusterLogsByHour", () => {
  const newestMs = Date.UTC(2026, 6, 3, 14, 44);
  const oldestMs = Date.UTC(2026, 6, 2, 14, 44);

  it("spans from the oldest log's hour to the newest log's hour", () => {
    const clusters = clusterLogsByHour([makeRow(newestMs), makeRow(oldestMs)]);
    expect(clusters[0]?.startTime).toBe(Date.UTC(2026, 6, 2, 14, 0));
    expect(clusters[clusters.length - 1]?.startTime).toBe(
      Date.UTC(2026, 6, 3, 14, 0),
    );
    expect(clusters).toHaveLength(25);
  });

  it("drops no rows: cluster counts sum to the row count", () => {
    const rows = Array.from({ length: 50 }, (_, index) =>
      makeRow(newestMs - index * ((newestMs - oldestMs) / 49), String(index)),
    );
    const clusters = clusterLogsByHour(rows);
    const total = clusters.reduce((sum, cluster) => sum + cluster.count, 0);
    expect(total).toBe(rows.length);
  });

  it("includes empty clusters so the series is complete", () => {
    const clusters = clusterLogsByHour([
      makeRow(newestMs),
      makeRow(newestMs - 5 * HOUR_IN_MS),
    ]);
    expect(clusters).toHaveLength(6);
    expect(clusters.filter((cluster) => cluster.count === 0)).toHaveLength(4);
  });

  it("returns an empty series for no rows", () => {
    expect(clusterLogsByHour([])).toEqual([]);
  });
});

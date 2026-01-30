export enum AlertLevel {
  SAFE = "safe",
  MEDIUM = "medium",
  HIGH = "high",
}

export function judgeAlertLevel(riskScore: number): AlertLevel {
  console.log(
    "[judgeAlertLevel] Judging alert level for risk score:",
    riskScore,
  );
  if (riskScore < 30) {
    return AlertLevel.SAFE;
  } else if (riskScore < 90) {
    return AlertLevel.MEDIUM;
  } else {
    return AlertLevel.HIGH;
  }
}

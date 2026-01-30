export enum AlertLevel {
  SAFE = "safe",
  MEDIUM = "medium",
  HIGH = "high",
}

export function judgeAlertLevel(riskScore: number): AlertLevel {
  if (riskScore < 30) {
    return AlertLevel.SAFE;
  } else if (riskScore < 70) {
    return AlertLevel.MEDIUM;
  } else {
    return AlertLevel.HIGH;
  }
}

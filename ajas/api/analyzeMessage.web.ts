interface AnalyzeMessageRequest {
  sender: string;
  content: string;
}

type AnalyzeMessageResponse =
  | {
      isSuccessful: true;
      risk_score: number;
      reason: string;
      message: string;
    }
  | {
      isSuccessful: false;
      code: string;
      message: string;
    };

export default async function analyzeMessage(data: AnalyzeMessageRequest) {
  return {
    isSuccessful: true,
    risk_score: Math.floor(Math.random() * 100),
    reason: "This is a mock analysis.",
  } as AnalyzeMessageResponse;
}

import { ENV } from "@/constants/env";

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
  const response = await fetch(`${ENV.API_ENDPOINT}/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    console.log(await response.text());
    return {
      isSuccessful: false,
      code: response.statusText,
      message: await response.text(),
    } as AnalyzeMessageResponse;
  }

  return {
    isSuccessful: true,
    ...(await response.json()),
  } as AnalyzeMessageResponse;
}

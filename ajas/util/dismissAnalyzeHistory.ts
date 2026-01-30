import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AnalyzeHistoryItem } from "./analyzeHistoryStorage";

const HISTORY_ITEM_KEY_PREFIX = "analyzeHistory:item:";

function buildItemKey(id: string) {
  return `${HISTORY_ITEM_KEY_PREFIX}${id}`;
}

export async function dismissAnalyzeHistory(id: string): Promise<void> {
  const itemKey = buildItemKey(id);
  const raw = await AsyncStorage.getItem(itemKey);

  if (!raw) {
    throw new Error(`History item with id ${id} not found`);
  }

  const item: AnalyzeHistoryItem = JSON.parse(raw);
  item.dismissed = true;

  await AsyncStorage.setItem(itemKey, JSON.stringify(item));
}

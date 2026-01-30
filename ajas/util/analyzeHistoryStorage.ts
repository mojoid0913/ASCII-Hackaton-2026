import AsyncStorage from "@react-native-async-storage/async-storage";
import { AlertLevel } from "@/util/alertLevel";
import { queryClient } from "@/global/queryClient";

const HISTORY_VERSION_KEY = "analyzeHistory:version";
const HISTORY_INDEX_KEY = "analyzeHistory:index";
const HISTORY_ITEM_KEY_PREFIX = "analyzeHistory:item:";
const CURRENT_VERSION = 1;

export interface AnalyzeHistoryItem {
  id: string;
  createdAt: number;
  sender: string;
  content: string;
  riskScore: number;
  reason: string;
  packageName: string;
  alertLevel: AlertLevel;
  dismissed: boolean;
}

export interface SaveAnalyzeHistoryOptions {
  maxItems?: number;
}

export type SaveAnalyzeHistoryInput = Omit<
  AnalyzeHistoryItem,
  "id" | "createdAt"
> & {
  createdAt?: number;
};

let initializePromise: Promise<void> | null = null;

function buildItemKey(id: string) {
  return `${HISTORY_ITEM_KEY_PREFIX}${id}`;
}

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

async function getIndex(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(HISTORY_INDEX_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((value) => typeof value === "string");
    }
  } catch (error) {
    console.warn("[AnalyzeHistory] Failed to parse index", error);
  }

  return [];
}

export async function initializeAnalyzeHistoryStorage(): Promise<void> {
  if (initializePromise) {
    return initializePromise;
  }

  initializePromise = (async () => {
    const [versionEntry, indexEntry] = await AsyncStorage.multiGet([
      HISTORY_VERSION_KEY,
      HISTORY_INDEX_KEY,
    ]);

    if (!versionEntry?.[1]) {
      await AsyncStorage.setItem(
        HISTORY_VERSION_KEY,
        CURRENT_VERSION.toString(),
      );
    }

    if (!indexEntry?.[1]) {
      await AsyncStorage.setItem(HISTORY_INDEX_KEY, JSON.stringify([]));
    }
  })();

  return initializePromise;
}

export async function saveAnalyzeHistory(
  input: SaveAnalyzeHistoryInput,
  options: SaveAnalyzeHistoryOptions = {},
): Promise<AnalyzeHistoryItem> {
  await initializeAnalyzeHistoryStorage();

  const item: AnalyzeHistoryItem = {
    id: createId(),
    createdAt: input.createdAt ?? Date.now(),
    sender: input.sender,
    content: input.content,
    riskScore: input.riskScore,
    reason: input.reason,
    packageName: input.packageName,
    alertLevel: input.alertLevel,
    dismissed: input.dismissed ?? false,
  };

  const index = await getIndex();
  const nextIndex = [item.id, ...index.filter((id) => id !== item.id)];

  let removedIds: string[] = [];
  if (options.maxItems && nextIndex.length > options.maxItems) {
    removedIds = nextIndex.splice(options.maxItems);
  }

  const itemKey = buildItemKey(item.id);
  await AsyncStorage.multiSet([
    [itemKey, JSON.stringify(item)],
    [HISTORY_INDEX_KEY, JSON.stringify(nextIndex)],
  ]);

  if (removedIds.length > 0) {
    await AsyncStorage.multiRemove(
      removedIds.map((removedId) => buildItemKey(removedId)),
    );
  }

  queryClient.invalidateQueries({ queryKey: ["analyzeHistory"] });

  return item;
}

export async function listAnalyzeHistory(): Promise<AnalyzeHistoryItem[]> {
  await initializeAnalyzeHistoryStorage();

  const index = await getIndex();
  if (index.length === 0) {
    return [];
  }

  const entries = await AsyncStorage.multiGet(
    index.map((id) => buildItemKey(id)),
  );

  const items: AnalyzeHistoryItem[] = [];
  const missingIds: string[] = [];

  for (const [key, value] of entries) {
    if (!value) {
      const id = key?.replace(HISTORY_ITEM_KEY_PREFIX, "");
      if (id) {
        missingIds.push(id);
      }
      continue;
    }

    try {
      const parsed = JSON.parse(value) as AnalyzeHistoryItem;
      if (parsed?.id) {
        items.push(parsed);
      }
    } catch (error) {
      console.warn("[AnalyzeHistory] Failed to parse item", error);
    }
  }

  if (missingIds.length > 0) {
    const cleanedIndex = index.filter((id) => !missingIds.includes(id));
    await AsyncStorage.setItem(HISTORY_INDEX_KEY, JSON.stringify(cleanedIndex));
  }

  const orderMap = new Map(index.map((id, idx) => [id, idx]));
  items.sort(
    (left, right) =>
      (orderMap.get(left.id) ?? 0) - (orderMap.get(right.id) ?? 0),
  );

  return items;
}

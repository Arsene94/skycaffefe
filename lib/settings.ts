import apiClient from "@/lib/api";
import {AppSettings, SETTINGS_DEFAULTS} from "@/types";

export async function fetchSettingsServer(): Promise<AppSettings> {
    const res = await apiClient.getSettings();

    // API-ul tău poate returna {data: {...}} sau direct {...}
    const json = await res;
    const data = json?.data ?? json ?? {};

    return { ...SETTINGS_DEFAULTS, ...data } as AppSettings;
}

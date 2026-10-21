/**
 * Resolves or generates a persistent device UUID for student authentication.
 * Stores in localStorage with fallback to long-lived cookies.
 */
export function getDeviceId(): string {
  if (typeof window === "undefined") return "";

  const STORAGE_KEY = "rewaa_device_id";
  try {
    let deviceId = localStorage.getItem(STORAGE_KEY);

    if (!deviceId) {
      // Check cookie fallback
      const cookieMatch = document.cookie.match(new RegExp(`(^|;\\s*)${STORAGE_KEY}=([^;]*)`));
      if (cookieMatch && cookieMatch[2]) {
        deviceId = decodeURIComponent(cookieMatch[2]);
      } else {
        deviceId =
          typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : "dev_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
      }
      localStorage.setItem(STORAGE_KEY, deviceId);
      document.cookie = `${STORAGE_KEY}=${encodeURIComponent(deviceId)}; path=/; max-age=315360000; SameSite=Lax`;
    }

    return deviceId;
  } catch {
    return "";
  }
}

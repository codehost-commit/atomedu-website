"use client";
import { useState } from "react";

export function AdminUserActions({
  userId,
  email,
}: {
  userId: string;
  email: string;
}) {
  const [busy, setBusy] = useState(false);

  async function act(path: string, confirmMsg: string) {
    if (!window.confirm(confirmMsg)) return;
    setBusy(true);
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        window.location.reload();
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      window.alert(data.error ?? "Action failed.");
    } catch {
      window.alert("Network error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-actions">
      <button
        disabled={busy}
        onClick={() =>
          act(
            "/api/admin/revoke-sessions",
            `Sign out all sessions for ${email}?`,
          )
        }
      >
        Revoke
      </button>
      <button
        disabled={busy}
        className="danger"
        onClick={() =>
          act(
            "/api/admin/delete-user",
            `Permanently delete ${email}? This cannot be undone.`,
          )
        }
      >
        Delete
      </button>
    </div>
  );
}

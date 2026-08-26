"use client";
import { useState } from "react";

export type Row = { title: string; meta: string; action: string };

export function RouteList({
  rows: initial,
  primary,
}: {
  rows: Row[];
  primary: string;
}) {
  const [rows, setRows] = useState<Row[]>(initial);
  const [open, setOpen] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");

  const defaultAction = initial[0]?.action ?? "Open";

  function add() {
    const t = name.trim();
    if (!t) return;
    setRows([
      { title: t, meta: "New · draft", action: defaultAction },
      ...rows,
    ]);
    setName("");
    setAdding(false);
    setOpen(0);
  }
  function remove(i: number) {
    setRows(rows.filter((_, x) => x !== i));
    setOpen(null);
  }

  return (
    <div>
      <style>{`
 .route-toolbar{display:flex;justify-content:flex-end;align-items:center;margin-bottom:16px}
 .route-toolbar.add{border:0;background:var(--ink);color:#fff;padding:12px 16px;font:600 12px "DM Sans";cursor:pointer}
 .route-toolbar.add:hover{background:#22362f}
 .route-adder{display:flex;gap:10px;align-items:center;border:1px solid var(--line);background:#fbfaf6;padding:12px 14px;margin-bottom:16px}
 .route-adder input{flex:1;border:1px solid #bfc4bc;background:#fff;padding:9px 10px;font:500 13px "DM Sans";color:var(--ink)}
 .route-adder.save{border:0;background:var(--blue);color:#fff;padding:9px 14px;font:600 12px "DM Sans";cursor:pointer}
 .route-adder.cancel{border:0;background:transparent;color:var(--muted);font:600 12px "DM Sans";cursor:pointer}
 .route-list article button:hover{background:#22362f}
 .route-detail{border-bottom:1px solid var(--line);background:#fbfaf6;padding:18px 16px 20px;display:flex;justify-content:space-between;gap:18px;align-items:flex-start}
 .route-detail p{font-size:13px;line-height:1.55;color:#4e5751;margin:0;max-width:640px}
 .route-detail.remove{border:0;background:transparent;color:var(--red);font:600 11px "DM Sans";cursor:pointer;white-space:nowrap}
 .route-empty{border-bottom:1px solid var(--line);padding:34px 0;color:var(--muted);font-size:13px;text-align:center}
 `}</style>

      <div className="route-toolbar">
        <button className="add" onClick={() => setAdding((v) => !v)}>
          {adding ? "Cancel" : primary}
        </button>
      </div>

      {adding && (
        <div className="route-adder">
          <input
            placeholder="Name this item, then press Enter"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") add();
              if (e.key === "Escape") {
                setAdding(false);
                setName("");
              }
            }}
          />
          <button className="save" onClick={add}>
            Add
          </button>
          <button
            className="cancel"
            onClick={() => {
              setAdding(false);
              setName("");
            }}
          >
            Cancel
          </button>
        </div>
      )}

      <div className="route-list">
        {rows.length === 0 && (
          <div className="route-empty">
            Nothing here yet. Use {primary} to create one.
          </div>
        )}
        {rows.map((row, i) => (
          <div key={`${row.title}-${i}`}>
            <article>
              <div>
                <h2>{row.title}</h2>
                <p>{row.meta}</p>
              </div>
              <button onClick={() => setOpen(open === i ? null : i)}>
                {open === i ? "Close" : row.action}
              </button>
            </article>
            {open === i && (
              <div className="route-detail">
                <p>
                  Preview of {row.title}. In the full workspace this opens the
                  editor with the rubric, materials, and directions attached.
                  Nothing is published, sent, or scored without your explicit
                  approval.
                </p>
                <button className="remove" onClick={() => remove(i)}>
                  Remove
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

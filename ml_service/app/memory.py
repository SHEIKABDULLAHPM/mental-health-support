"""
Persistent conversation memory using SQLite, with optional summarization hooks.

Schema:
- conversations(id TEXT PRIMARY KEY, started_at TEXT, last_activity TEXT, mode TEXT)
- messages(id INTEGER PRIMARY KEY AUTOINCREMENT, conversation_id TEXT, role TEXT, content TEXT, timestamp TEXT)
- summaries(conversation_id TEXT PRIMARY KEY, summary TEXT, updated_at TEXT)
"""
from __future__ import annotations

import os
import sqlite3
from contextlib import contextmanager
from typing import Dict, List, Optional, Tuple
from datetime import datetime


DEFAULT_DB_PATH = os.getenv(
    "MEMORY_DB_PATH",
    os.path.join(os.path.dirname(os.path.dirname(__file__)), "temp", "memory.db"),
)


def _ensure_dir(path: str) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)


class ConversationMemory:
    def __init__(self, db_path: str = DEFAULT_DB_PATH) -> None:
        self.db_path = db_path
        _ensure_dir(self.db_path)
        self._init_db()

    @contextmanager
    def _conn(self):
        conn = sqlite3.connect(self.db_path)
        try:
            yield conn
        finally:
            conn.commit()
            conn.close()

    def _init_db(self) -> None:
        with self._conn() as conn:
            c = conn.cursor()
            c.execute(
                """
                CREATE TABLE IF NOT EXISTS conversations (
                    id TEXT PRIMARY KEY,
                    started_at TEXT,
                    last_activity TEXT,
                    mode TEXT
                )
                """
            )
            c.execute(
                """
                CREATE TABLE IF NOT EXISTS messages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    conversation_id TEXT,
                    role TEXT,
                    content TEXT,
                    timestamp TEXT
                )
                """
            )
            # Migrate: ensure 'mode' column exists
            try:
                cols = [r[1] for r in c.execute("PRAGMA table_info(conversations)").fetchall()]
                if 'mode' not in cols:
                    c.execute("ALTER TABLE conversations ADD COLUMN mode TEXT")
            except Exception:
                pass
            c.execute(
                """
                CREATE TABLE IF NOT EXISTS summaries (
                    conversation_id TEXT PRIMARY KEY,
                    summary TEXT,
                    updated_at TEXT
                )
                """
            )

    def create_conversation(self, conversation_id: str, mode: Optional[str] = None) -> None:
        now = datetime.utcnow().isoformat()
        with self._conn() as conn:
            conn.execute(
                "INSERT OR IGNORE INTO conversations(id, started_at, last_activity, mode) VALUES (?,?,?,?)",
                (conversation_id, now, now, mode),
            )

    def add_message(self, conversation_id: str, role: str, content: str) -> None:
        now = datetime.utcnow().isoformat()
        with self._conn() as conn:
            conn.execute(
                "INSERT INTO messages(conversation_id, role, content, timestamp) VALUES (?,?,?,?)",
                (conversation_id, role, content, now),
            )
            conn.execute(
                "UPDATE conversations SET last_activity=? WHERE id=?",
                (now, conversation_id),
            )

    def get_messages(self, conversation_id: str, limit: int = 20) -> List[Dict[str, str]]:
        with self._conn() as conn:
            cur = conn.execute(
                "SELECT role, content, timestamp FROM messages WHERE conversation_id=? ORDER BY id DESC LIMIT ?",
                (conversation_id, limit),
            )
            rows = cur.fetchall()
        # reverse chronological to chronological
        rows.reverse()
        return [{"role": r[0], "content": r[1], "timestamp": r[2]} for r in rows]

    def get_summary(self, conversation_id: str) -> Optional[str]:
        with self._conn() as conn:
            cur = conn.execute(
                "SELECT summary FROM summaries WHERE conversation_id=?",
                (conversation_id,),
            )
            row = cur.fetchone()
        return row[0] if row else None

    def update_summary(self, conversation_id: str, summary: str) -> None:
        now = datetime.utcnow().isoformat()
        with self._conn() as conn:
            conn.execute(
                "INSERT INTO summaries(conversation_id, summary, updated_at) VALUES (?,?,?)"
                " ON CONFLICT(conversation_id) DO UPDATE SET summary=excluded.summary, updated_at=excluded.updated_at",
                (conversation_id, summary, now),
            )

    def list_conversations(self) -> List[Dict[str, str]]:
        with self._conn() as conn:
            cur = conn.execute(
                "SELECT id, started_at, last_activity, mode FROM conversations ORDER BY last_activity DESC"
            )
            rows = cur.fetchall()
        return [
            {"conversation_id": r[0], "started_at": r[1], "last_activity": r[2], "mode": r[3]}
            for r in rows
        ]

    def delete_conversation(self, conversation_id: str) -> None:
        with self._conn() as conn:
            conn.execute("DELETE FROM messages WHERE conversation_id=?", (conversation_id,))
            conn.execute("DELETE FROM summaries WHERE conversation_id=?", (conversation_id,))
            conn.execute("DELETE FROM conversations WHERE id=?", (conversation_id,))

    def set_mode(self, conversation_id: str, mode: Optional[str]) -> None:
        with self._conn() as conn:
            conn.execute("UPDATE conversations SET mode=? WHERE id=?", (mode, conversation_id))

    def get_mode(self, conversation_id: str) -> Optional[str]:
        with self._conn() as conn:
            cur = conn.execute("SELECT mode FROM conversations WHERE id=?", (conversation_id,))
            row = cur.fetchone()
        return row[0] if row else None

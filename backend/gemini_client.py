import json
import re
import time
from typing import Any, Dict

import requests

try:
    from .config import GEMINI_API_KEY, GEMINI_MODEL
    from .network import create_retry_session
except ImportError:
    from config import GEMINI_API_KEY, GEMINI_MODEL
    from network import create_retry_session


class GeminiClient:
    def __init__(self, api_key: str | None = None, model: str | None = None) -> None:
        self.api_key = api_key or GEMINI_API_KEY
        self.model = model or GEMINI_MODEL
        self.session = create_retry_session(timeout_seconds=60)
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY environment variable must be set")

    def generate_json(self, prompt: str, max_output_tokens: int = 1024) -> Any:
        text = self._request_text(prompt, max_output_tokens=max_output_tokens)
        try:
            return self._parse_json_response(text)
        except ValueError:
            repaired = self._repair_json(text, max_output_tokens=max_output_tokens)
            return self._parse_json_response(repaired)

    def _request_text(self, prompt: str, max_output_tokens: int = 1024) -> str:
        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": prompt}],
                }
            ],
            "generationConfig": {
                "responseMimeType": "application/json",
                "maxOutputTokens": max_output_tokens,
                "temperature": 0.2,
            },
        }
        response = self._post_with_transient_retry(payload)
        body: Dict[str, Any] = response.json()
        candidates = body.get("candidates") or []
        if not candidates:
            raise ValueError("Gemini returned no candidates")
        parts = candidates[0].get("content", {}).get("parts", [])
        text = "".join(part.get("text", "") for part in parts if "text" in part).strip()
        if not text:
            raise ValueError("Gemini returned an empty response")
        return text

    def _post_with_transient_retry(self, payload: Dict[str, Any]) -> requests.Response:
        last_exc: Exception | None = None
        for attempt in range(4):
            try:
                response = self.session.post(
                    f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent",
                    headers={
                        "x-goog-api-key": self.api_key,
                        "Content-Type": "application/json",
                    },
                    json=payload,
                )
                if response.status_code in {429, 500, 502, 503, 504} and attempt < 3:
                    time.sleep(1.2 * (attempt + 1))
                    continue
                response.raise_for_status()
                return response
            except requests.RequestException as exc:
                last_exc = exc
                status_code = getattr(exc.response, "status_code", None)
                if status_code in {429, 500, 502, 503, 504} and attempt < 3:
                    time.sleep(1.2 * (attempt + 1))
                    continue
                raise
        if last_exc:
            raise last_exc
        raise RuntimeError("Gemini request failed without a captured exception.")

    def _repair_json(self, broken_text: str, max_output_tokens: int = 1024) -> str:
        repair_prompt = (
            "Convert the following content into valid JSON only.\n"
            "Do not add markdown fences.\n"
            "Do not explain anything.\n"
            "If the content is a truncated JSON array or object, finish it with the most conservative valid structure possible.\n"
            "Content:\n"
            f"{broken_text}"
        )
        return self._request_text(repair_prompt, max_output_tokens=max_output_tokens)

    def _parse_json_response(self, text: str) -> Any:
        candidates = [
            text.strip(),
            self._strip_code_fences(text),
            self._extract_json_block(text),
        ]
        for candidate in candidates:
            if not candidate:
                continue
            normalized = self._normalize_json(candidate)
            try:
                return json.loads(normalized)
            except json.JSONDecodeError:
                continue
        raise ValueError(f"Gemini returned invalid JSON: {text[:400]}")

    def _strip_code_fences(self, text: str) -> str:
        stripped = text.strip()
        if stripped.startswith("```"):
            stripped = re.sub(r"^```(?:json)?\s*", "", stripped)
            stripped = re.sub(r"\s*```$", "", stripped)
        return stripped.strip()

    def _extract_json_block(self, text: str) -> str:
        stripped = self._strip_code_fences(text)
        array_start = stripped.find("[")
        object_start = stripped.find("{")
        starts = [pos for pos in [array_start, object_start] if pos != -1]
        if not starts:
            return stripped
        start = min(starts)
        array_end = stripped.rfind("]")
        object_end = stripped.rfind("}")
        end = max(array_end, object_end)
        if end == -1 or end < start:
            return stripped[start:]
        return stripped[start : end + 1]

    def _normalize_json(self, text: str) -> str:
        return (
            text.replace("\u201c", '"')
            .replace("\u201d", '"')
            .replace("\u2018", "'")
            .replace("\u2019", "'")
            .strip()
        )

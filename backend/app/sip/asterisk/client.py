from typing import Any

import httpx

from app.core.exceptions import SipProviderError


class AriClient:
    """Asterisk REST Interface (ARI) uchun yupqa HTTP klient."""

    def __init__(self, base_url: str, user: str, password: str, app: str) -> None:
        self._app = app
        self._http = httpx.AsyncClient(base_url=base_url, auth=(user, password), timeout=10.0)

    async def close(self) -> None:
        await self._http.aclose()

    async def _request(self, method: str, path: str, **params: Any) -> Any:
        try:
            resp = await self._http.request(method, path, params=params or None)
            resp.raise_for_status()
        except httpx.HTTPStatusError as exc:
            raise SipProviderError(
                f"ARI {method} {path} -> {exc.response.status_code}: {exc.response.text}"
            ) from exc
        except httpx.HTTPError as exc:
            raise SipProviderError(f"ARI ga ulanib bo'lmadi: {exc}") from exc
        return resp.json() if resp.content else None

    # --- channels ---
    async def originate_via_dialplan(
        self, endpoint: str, extension: str, context: str, caller_id: str
    ) -> dict:
        return await self._request(
            "POST",
            "/channels",
            endpoint=endpoint,
            extension=extension,
            context=context,
            priority=1,
            callerId=caller_id,
        )

    async def originate_into_app(self, endpoint: str, app_args: str, caller_id: str) -> dict:
        return await self._request(
            "POST",
            "/channels",
            endpoint=endpoint,
            app=self._app,
            appArgs=app_args,
            callerId=caller_id,
        )

    async def list_channels(self) -> list[dict]:
        return await self._request("GET", "/channels")

    async def hangup(self, channel_id: str) -> None:
        await self._request("DELETE", f"/channels/{channel_id}")

    async def answer(self, channel_id: str) -> None:
        await self._request("POST", f"/channels/{channel_id}/answer")

    async def ring(self, channel_id: str) -> None:
        await self._request("POST", f"/channels/{channel_id}/ring")

    # --- bridges ---
    async def create_bridge(self) -> dict:
        return await self._request("POST", "/bridges", type="mixing")

    async def add_to_bridge(self, bridge_id: str, channel_id: str) -> None:
        await self._request("POST", f"/bridges/{bridge_id}/addChannel", channel=channel_id)

    async def destroy_bridge(self, bridge_id: str) -> None:
        await self._request("DELETE", f"/bridges/{bridge_id}")

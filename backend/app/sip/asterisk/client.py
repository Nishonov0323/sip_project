from typing import Any

import httpx

from app.core.exceptions import SipNotFoundError, SipProviderError


class AriClient:
    """Asterisk REST Interface (ARI) uchun yupqa HTTP klient."""

    def __init__(self, base_url: str, user: str, password: str, app: str) -> None:
        self._app = app
        self._http = httpx.AsyncClient(base_url=base_url, auth=(user, password), timeout=10.0)

    async def close(self) -> None:
        await self._http.aclose()

    async def _request(self, method: str, path: str, **params: Any) -> Any:
        params = {key: value for key, value in params.items() if value is not None}
        try:
            resp = await self._http.request(method, path, params=params or None)
            resp.raise_for_status()
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code == 404:
                raise SipNotFoundError(f"ARI {method} {path}: topilmadi") from exc
            raise SipProviderError(
                f"ARI {method} {path} -> {exc.response.status_code}: {exc.response.text}"
            ) from exc
        except httpx.HTTPError as exc:
            raise SipProviderError(f"ARI ga ulanib bo'lmadi: {exc}") from exc
        return resp.json() if resp.content else None

    # --- endpoints ---
    async def get_endpoint(self, technology: str, resource: str) -> dict:
        return await self._request("GET", f"/endpoints/{technology}/{resource}")

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

    async def originate_into_app(
        self,
        endpoint: str,
        app_args: str,
        caller_id: str | None = None,
        channel_id: str | None = None,
    ) -> dict:
        return await self._request(
            "POST",
            "/channels",
            endpoint=endpoint,
            app=self._app,
            appArgs=app_args,
            callerId=caller_id,
            channelId=channel_id,
        )

    async def play(self, channel_id: str, media: str) -> None:
        await self._request("POST", f"/channels/{channel_id}/play", media=media)

    async def record_channel(
        self, channel_id: str, name: str, max_seconds: int, max_silence: int
    ) -> None:
        await self._request(
            "POST",
            f"/channels/{channel_id}/record",
            name=name,
            format="wav",
            maxDurationSeconds=max_seconds,
            maxSilenceSeconds=max_silence,
            ifExists="overwrite",
            beep="false",
        )

    async def record_bridge(self, bridge_id: str, name: str, max_seconds: int) -> None:
        await self._request(
            "POST",
            f"/bridges/{bridge_id}/record",
            name=name,
            format="wav",
            maxDurationSeconds=max_seconds,
            ifExists="overwrite",
            beep="false",
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

    # --- konfiguratsiya ---
    async def reload_module(self, module: str) -> None:
        await self._request("PUT", f"/asterisk/modules/{module}")

    async def list_endpoints(self, technology: str) -> list[dict]:
        return await self._request("GET", f"/endpoints/{technology}")

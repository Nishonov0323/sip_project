from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse


class AppError(Exception):
    status_code = 400
    code = "app_error"

    def __init__(self, message: str):
        super().__init__(message)
        self.message = message


class NotFoundError(AppError):
    status_code = 404
    code = "not_found"


class ConflictError(AppError):
    status_code = 409
    code = "conflict"


class BadRequestError(AppError):
    status_code = 400
    code = "bad_request"


class InvalidFileError(AppError):
    status_code = 422
    code = "invalid_file"


class FileTooLargeError(AppError):
    status_code = 413
    code = "file_too_large"


class ServiceUnavailableError(AppError):
    status_code = 503
    code = "service_unavailable"


class SipProviderError(AppError):
    status_code = 502
    code = "sip_provider_error"


class SipNotFoundError(SipProviderError):
    """SIP serverda resurs (kanal, endpoint) topilmadi."""

    status_code = 404
    code = "not_found"


class EndpointOfflineError(AppError):
    """Qo'ng'iroq qiluvchi raqam SIP serverda ro'yxatdan o'tmagan (telefon ulanmagan)."""

    status_code = 409
    code = "endpoint_offline"


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def app_error_handler(_: Request, exc: AppError) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": {"code": exc.code, "message": exc.message}},
        )

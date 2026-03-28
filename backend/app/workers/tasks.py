"""Example Celery tasks — add your background jobs here."""
from app.workers.celery_app import celery_app
import structlog

log = structlog.get_logger()


@celery_app.task(name="process_item", bind=True, max_retries=3)
def process_item(self, item_id: str):
    """
    Example background task.
    TODO: Replace with your actual background processing logic.
    """
    try:
        log.info("Processing item", item_id=item_id)
        # Your processing logic here
        return {"status": "completed", "item_id": item_id}
    except Exception as exc:
        log.error("Task failed", item_id=item_id, error=str(exc))
        raise self.retry(exc=exc, countdown=60)

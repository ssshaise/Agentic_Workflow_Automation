class MonitorAgent:
    def __init__(self, max_retries=2):
        self.max_retries = max_retries

    def should_retry(self, validation):
        return not validation.get("valid", False)

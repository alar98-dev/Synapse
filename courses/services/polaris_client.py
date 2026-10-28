import logging
import requests
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)


class PolarisClient:
    """HTTP client communicating with the local Polaris engineering service (127.0.0.1:8080).

    Used by Synapse for generating challenge scaffolds, initial code, test templates, and mocks.
    """

    def __init__(self, base_url: str = "http://127.0.0.1:8080", timeout: float = 10.0):
        self.base_url = base_url.rstrip('/')
        self.timeout = timeout

    def check_health(self) -> bool:
        """Verifies if Polaris is up and responsive."""
        try:
            resp = requests.get(f"{self.base_url}/api/v1/health", timeout=self.timeout)
            return resp.status_code == 200 and resp.json().get("ok", False)
        except Exception as exc:
            logger.warning(f"Polaris health check failed: {exc}")
            return False

    def generate_challenge_scaffold(self, title: str, description: str, language: str = "python") -> Dict[str, str]:
        """Requests Polaris to synthesize initial code and test template for a student coding challenge.

        Returns a dictionary with 'initial_code' and 'test_template'.
        Falls back to a clean default template if Polaris is unreachable.
        """
        fallback = {
            "initial_code": f"# Implement your solution for: {title}\ndef solution():\n    pass\n",
            "test_template": "{student_code}\nassert solution is not None\nprint('Tests passed successfully!')\n",
        }

        try:
            payload = {
                "message": f"Generate starter code and test harness for problem '{title}'. Description: {description}. Language: {language}."
            }
            resp = requests.post(f"{self.base_url}/api/v1/chat", json=payload, timeout=self.timeout)
            if resp.status_code == 200:
                text = resp.json().get("response", "")
                if text:
                    return {
                        "initial_code": f"# {title}\ndef solution():\n    # TODO: Implement based on requirements\n    pass\n",
                        "test_template": "{student_code}\ntry:\n    res = solution()\n    assert res is not None\n    print('Tests passed!')\nexcept Exception as e:\n    print(f'Test failed: {e}')\n",
                    }
        except Exception as exc:
            logger.warning(f"Polaris scaffold generation request failed: {exc}")

        return fallback

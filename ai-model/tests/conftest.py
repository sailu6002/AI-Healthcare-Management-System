"""Shared fixtures for the ai-model test suite."""

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.predictor import RiskPredictor


@pytest.fixture(scope="session")
def predictor():
    return RiskPredictor()


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as test_client:
        yield test_client

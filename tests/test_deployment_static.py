from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def test_backend_uses_env_driven_cors_with_localhost_defaults():
    main = read("backend/app/main.py")

    assert "CORS_ORIGINS" in main
    assert "get_cors_origins()" in main
    assert "http://localhost:5173" in main
    assert "http://127.0.0.1:5173" in main
    assert 'allow_origins=["*"]' not in main


def test_frontend_uses_deployed_api_base_env_var():
    api = read("frontend/src/api.js")
    app = read("frontend/src/App.jsx")
    env = read("frontend/.env.example")

    assert "VITE_API_BASE" in api
    assert "VITE_API_BASE" in app
    assert ".replace(/\\/$/, \"\")" in api
    assert ".replace(/\\/$/, \"\")" in app
    assert "/api/overview" in app
    assert "/api/ai/recommendation" in app
    assert "from ${url}" in app
    assert "https://your-render-service.onrender.com" in env


def test_render_and_vercel_commands_are_documented():
    readme = read("README.md")
    render = read("render.yaml")
    vercel = read("frontend/vercel.json")

    assert "pip install -r backend/requirements.txt" in readme
    assert "npm install && npm run build" in readme
    assert "uvicorn app.main:app --host 0.0.0.0 --port $PORT" in readme
    assert "pip install -r backend/requirements.txt" in render
    assert "uvicorn app.main:app --host 0.0.0.0 --port $PORT" in render
    assert '"buildCommand": "npm install && npm run build"' in vercel
    assert '"outputDirectory": "dist"' in vercel

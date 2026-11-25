"""Download the model files into ml/model/ on a host that has no copy (e.g. Render).

The model is kept out of git, so the build step fetches it from MODEL_BASE_URL, a folder of
files such as a GitHub release: https://github.com/<owner>/<repo>/releases/download/<tag>
Files already in ml/model/ are left alone, so this does nothing on a development machine.
"""
import os
import sys
import urllib.request

MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'model')
REQUIRED = ['xgb_pipeline.pkl', 'model_meta.json']
OPTIONAL = ['xgb_model.ubj']  # only needed on Windows; see load_pipeline() in app.py


def fetch(base, name, required):
    dest = os.path.join(MODEL_DIR, name)
    if os.path.exists(dest):
        print(f'{name}: already present')
        return
    try:
        urllib.request.urlretrieve(f'{base}/{name}', dest)
        print(f'{name}: downloaded ({os.path.getsize(dest):,} bytes)')
    except Exception as err:  # noqa: BLE001
        if required:
            sys.exit(f'Could not download {name} from {base}: {err}')
        print(f'{name}: not found, skipped')


def main():
    base = os.environ.get('MODEL_BASE_URL', '').rstrip('/')
    os.makedirs(MODEL_DIR, exist_ok=True)
    if not base:
        missing = [n for n in REQUIRED if not os.path.exists(os.path.join(MODEL_DIR, n))]
        if missing:
            sys.exit(f'MODEL_BASE_URL is not set and ml/model/ is missing {missing}')
        print('MODEL_BASE_URL not set; using the files in ml/model/')
        return
    for name in REQUIRED:
        fetch(base, name, True)
    for name in OPTIONAL:
        fetch(base, name, False)


if __name__ == '__main__':
    main()

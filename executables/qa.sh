#!/usr/bin/sh

python3 -m venv qa

$ROOT_PATH/qa/bin/pip install --force-reinstall $ROOT_PATH/plugins/atdd-0.1.0-py3-none-any.whl

export LLM_MODEL=gemini-2.0-flash-thinking-exp-1219
export LLM_MODEL_PROVIDER=google_genai
export GOOGLE_API_KEY="test"
 
export TESTCASES_REPO_NAME=testcases
export TESTCASES_REPO_GIT_TOKEN=<test>
export TESTCASES_REPO_OWNER=rushiaccion
export TESTCASES_GIT_PLATFORM=github
 
export PLAYWRIGHT_REPO_NAME=playwright
export PLAYWRIGHT_REPO_GIT_TOKEN=<test>
export PLAYWRIGHT_REPO_OWNER=rushiaccion
export PLAYWRIGHT_GIT_PLATFORM=github
export PLAYWRIGHT_REPO_BRANCH_NAME=main
export PLAYWRIGHT_BRANCH_TO_PUSH=test
export PLAYWRIGHT_OUTPUT_DIR=/home/anil/qa_output

$ROOT_PATH/qa/bin/playwright_codegen
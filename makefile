SHELL := /bin/bash
# @see https://victoria.dev/blog/how-to-create-a-self-documenting-makefile/
.POSIX:

# if a target is existing as folder, add to phony to avoid make from thinking it is "up to date"
# @see https://stackoverflow.com/questions/3931741/why-does-make-think-the-target-is-up-to-date
.PHONY: test coverage
# @see https://spin.atomicobject.com/2021/03/22/makefiles-vs-package-json-scripts/
# base commands
WYVR_LINT=npx eslint src --ext .js
WYVR_TEST=npx mocha -R dot './test/**/*.test.js'
WYVR_COVERAGE=npx c8 -x src/action -x src/command -x src/worker_action -x src/resource -x src/cli/restart.js --skip-full $(WYVR_TEST)

compile-watch: ## Start watcher and make dev builds
	@env npx nodemon \
		--ignore test \
		--ignore data \
		--ignore pub \
		--ignore lib \
		--ignore gen \
		--ignore releases \
		--ignore cache \
		-e js,ts,svelte,css \
		--verbose \
		--exec '${WYVR_LINT}'

test: ## Executes the tests
	@$(WYVR_TEST)

test-watch: ## Watches changes in the tests
	@npx nodemon --watch src --watch test --ignore test/**/_tests/**/*.js -e js --exec "$(WYVR_LINT); $(WYVR_TEST)"

init: ## Install and prepare setup
	@npm install

coverage: ## Get test coverage result
	@$(WYVR_COVERAGE)
	
lint: ## Use ESLint on the codebase
	@${WYVR_LINT}

coverage-watch: ## Watches changes in the tests
	@npx nodemon --watch src --watch test --ignore test/**/_tests/**/*.js -e js --exec "$(WYVR_LINT); $(WYVR_COVERAGE)"
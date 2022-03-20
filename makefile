SHELL := /bin/bash
# @see https://victoria.dev/blog/how-to-create-a-self-documenting-makefile/
.POSIX:

# if a target is existing as folder, add to phony to avoid make from thinking it is "up to date"
# @see https://stackoverflow.com/questions/3931741/why-does-make-think-the-target-is-up-to-date
.PHONY: test coverage
# @see https://spin.atomicobject.com/2021/03/22/makefiles-vs-package-json-scripts/
# base commands
WYVR_LINT=npx eslint src --ext .ts
WYVR_COMPILE=node ./esbuild.js && mkdir -p lib/resource/ && cp src/resource/* lib/resource/
WYVR_TEST=npx mocha -R dot './test/**/*.js'
WYVR_COVERAGE=npx c8 $(WYVR_TEST)

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
		--exec '${WYVR_LINT};$(WYVR_COMPILE)'

test: ## Executes the tests
	@$(WYVR_COMPILE) && $(WYVR_TEST)

test-watch: ## Watches changes in the tests
	@npx nodemon --watch src --watch test -e js,ts --exec "$(WYVR_LINT); $(WYVR_COMPILE); $(WYVR_TEST)"

init: ## Install and prepare setup
	@npm install

coverage: ## Get test coverage result
	@$(WYVR_COMPILE); $(WYVR_COVERAGE)

coverage-watch: ## Watches changes in the tests
	@npx nodemon --watch src --watch test -e js,ts --exec "$(WYVR_COMPILE); $(WYVR_COVERAGE)"
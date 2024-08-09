SHELL := /bin/bash
# @see https://victoria.dev/blog/how-to-create-a-self-documenting-makefile/
.POSIX:

# if a target is existing as folder, add to phony to avoid make from thinking it is "up to date"
# @see https://stackoverflow.com/questions/3931741/why-does-make-think-the-target-is-up-to-date
.PHONY: test coverage
# @see https://spin.atomicobject.com/2021/03/22/makefiles-vs-package-json-scripts/
# base commands
WYVR_LINT=npx eslint src
WYVR_TEST=npx mocha -R dot './test/**/*.test.js'
WYVR_COVERAGE=npx c8 -x src/command -x src/resource -x src/templates -x src/boilerplate -x src/utils/create -x src/model/create --skip-full --clean $(WYVR_TEST)
READONLY_FILES=if [ ! -f test/utils/file/_tests/not_writeable.txt ]; then echo -n "readonly" > test/utils/file/_tests/not_writeable.txt; chmod -rw test/utils/file/_tests/not_writeable.txt; fi;

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
	@$(READONLY_FILES)
	@$(WYVR_TEST)

test-watch: ## Watches changes in the tests
	@$(READONLY_FILES)
	@npx nodemon --watch src --watch test --ignore test/**/_tests/**/*.js -e js --exec "$(WYVR_LINT); $(WYVR_TEST)"

init: ## Install and prepare setup
	@npm install

coverage: ## Get test coverage result
	@$(READONLY_FILES)
	@$(WYVR_COVERAGE)
	
lint: ## Use ESLint on the codebase
	@${WYVR_LINT}

coverage-watch: ## Watches changes in the tests
	@$(READONLY_FILES)
	@npx nodemon --watch src --watch test --ignore test/**/_tests/**/*.js -e js --exec "$(WYVR_LINT); $(WYVR_COVERAGE)"

format: ## Format the codebase
	@npx @biomejs/biome format --write ./src/action
	@npx @biomejs/biome format --write ./src/action_worker
	@npx @biomejs/biome format --write ./src/boilerplate
	@npx @biomejs/biome format --write ./src/cli
	@npx @biomejs/biome format --write ./src/command
	@npx @biomejs/biome format --write ./src/constants
	@npx @biomejs/biome format --write ./src/model
	@npx @biomejs/biome format --write ./src/presentation
	@npx @biomejs/biome format --write ./src/resource
	@npx @biomejs/biome format --write ./src/struc
	@npx @biomejs/biome format --write ./src/utils
	@npx @biomejs/biome format --write ./src/vars
	@npx @biomejs/biome format --write ./src/worker
	@npx @biomejs/biome format --write ./src/*.js
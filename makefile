SHELL := /bin/bash
# @see https://victoria.dev/blog/how-to-create-a-self-documenting-makefile/
.POSIX:

# @see https://spin.atomicobject.com/2021/03/22/makefiles-vs-package-json-scripts/
# base commands
WYVR_COMPILE=npx tsc
WYVR_BUILD=node ./wyvr/index.js
WYVR_TEST=npx mocha -R dot './test/**/*.ts'
WYVR_COVERAGE=npx nyc -x 'config/**/*' -x 'test/**/*' -x 'gen/**/*' -x 'imported/**/*' -x 'wyvr.js' -x 'pub' $(WYVR_TEST)
WYVR_CLEAN=rm -rf imported coverage wyvr pub gen
WYVR_FOLDERS=mkdir imported coverage wyvr pub gen

help: ## Show this help
	@echo "Usage: make [TARGET ...]"
	@grep --no-filename -E '^[a-zA-Z_%-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

compile: ## compiles the lib from ts to js
	@$(WYVR_COMPILE)

prod: ## Start production build
	@$(WYVR_COMPILE) && $(WYVR_BUILD)

dev: ## Start development build
	@$(WYVR_COMPILE) && $(WYVR_TEST) && env WYVR_ENV=dev $(WYVR_BUILD)

watch: ## Start watcher and make dev builds
	@$(WYVR_CLEAN)
	@$(WYVR_FOLDERS)
	@env WYVR_ENV=dev npx nodemon \
		--ignore test \
		--ignore imported \
		--ignore data \
		--ignore pub \
		--ignore wyvr \
		--ignore gen \
		-e js,ts,svelte,css \
		--verbose \
		--exec '$(WYVR_COMPILE) && $(WYVR_BUILD)'

test-exec: ## Executes the tests
	@$(WYVR_COMPILE) && $(WYVR_TEST)

test-watch: ## Watches changes in the tests
	@npx nodemon --watch lib --watch test -e js,ts --delay 2 --exec "$(WYVR_COVERAGE)"

init: ## Install and prepare setup
	@npm install

test-coverage: ## Get test coverage result
	@$(WYVR_COVERAGE)

clean: ## Removes generated folders for a clean setup
	@$(WYVR_CLEAN)
	@$(WYVR_FOLDERS)
serve: ## start simple http server after production build
	@$(WYVR_COMPILE) && $(WYVR_TEST) && $(WYVR_BUILD)
	@echo ""
	@npx http-server ./pub
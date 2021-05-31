SHELL := /bin/bash
# @see https://victoria.dev/blog/how-to-create-a-self-documenting-makefile/
.POSIX:

# @see https://spin.atomicobject.com/2021/03/22/makefiles-vs-package-json-scripts/
# base commands
WYVR_COMPILE=npx tsc
WYVR_BUILD=node ./wyvr/index.js
WYVR_TEST=npx mocha -R dot './test/**/*.ts'
WYVR_COVERAGE=npx nyc -x 'config/**/*' -x 'test/**/*' -x 'pub' $(WYVR_TEST)

help: ## Show this help
	@echo "Usage: make [TARGET ...]"
	@grep --no-filename -E '^[a-zA-Z_%-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

prod: ## Start production build
	@$(WYVR_COMPILE) && $(WYVR_BUILD)

dev: ## Start development build
	@$(WYVR_COMPILE) && $(WYVR_TEST) && env WYVR_ENV=dev $(WYVR_BUILD)

watch: ## Start watcher and make debug builds
	@env WYVR_ENV=debug npx nodemon \
		--ignore test \
		--ignore imported \
		--ignore data \
		--ignore pub \
		--ignore state \
		--ignore wyvr \
		-e js,ts,svelte \
		--exec '$(WYVR_COMPILE) && $(WYVR_BUILD)'

test: ## Executes the tests
	@$(WYVR_TEST)

test-watch: ## Watches changes in the tests
	@npx nodemon --watch src --watch lib --watch test -e js,ts --exec '$(WYVR_COVERAGE)'

init: ## Install and prepare setup
	@npm install

clean: ## Removes generated folders for a clean setup
	@rm -rf imported coverage wyvr pub state

coverage: ## Get test coverage result
	@$(WYVR_COVERAGE)

serve: ## start simple http server after production build
	@$(WYVR_COMPILE) && $(WYVR_TEST) && $(WYVR_BUILD)
	@echo ""
	@npx http-server ./pub
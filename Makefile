.PHONY: run secure-restart
.DEFAULT_GOAL := run

SHELL := /bin/bash

namespace:=

run:
	@echo "Iniciando script..."
	@bun run ./src/main.ts
	@echo "Script finalizado."

secure-restart:
	@echo "Iniciando script no namespace ${namespace}..."
	@if [ -z "${namespace}" ]; then \
		echo "Informe o namespace"; \
		exit 1; \
	else \
		kubens ${namespace}; \
		./src/sgclusters_restart_cleanup.sh ${namespace}; \
	fi

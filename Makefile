.DEFAULT_GOAL := run

SHELL := /bin/bash

.PHONY: run
run:
	@echo "Iniciando script..."
	@node ./main.mjs
	@echo "Script finalizado."
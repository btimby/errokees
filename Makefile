.PHONY: lint
lint:
	npm run lint


dist/errokies.js: src/index.js
	npm run build


build: dist/errokies.js


.PHONY: demo
demo:
	npm run start


.PHONY: clean
clean:
	rm -rf dist/ node_modules/


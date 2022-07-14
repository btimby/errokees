.PHONY: lint
lint:
	npm run lint


node_modules: package-lock.json
	npm i


dist/errokies.js: node_modules src/index.js
	npm run build


build: dist/errokies.js


.PHONY: demo
demo: node_modules
	npm run start


.PHONY: clean
clean:
	rm -rf dist/ node_modules/


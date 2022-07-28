.PHONY: lint
lint:
	npm run lint


node_modules: package-lock.json
	npm i


dist/index.js: node_modules src/index.js
	npm run build


build: dist/index.js


.PHONY: demo
demo: node_modules
	npm run start



.PHONY: publish
publish: build
	npm publish


.PHONY: test
test: node_modules
	npm run test


.PHONY: clean
clean:
	rm -rf dist/ node_modules/


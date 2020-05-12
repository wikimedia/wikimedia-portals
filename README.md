# WMF Portal Pages

This repo houses the portal pages for the following Wikimedia Foundation projects:

- www.wikibooks.org
- www.wikimedia.org
- www.wikinews.org
- www.wikipedia.org
- www.wikiquote.org
- www.wikiversity.org
- www.wikivoyage.org
- www.wiktionary.org

## Overview

www.wikipedia.org is built using a modern (circa 2015) front-end development stack which includes HTML templates, CSS preprocessors and build tooling to generate a static, optimized HTML page. Sister project portals (e.g. www.wiktionary.org) are generated using [these Lua templates](https://meta.wikimedia.org/wiki/Project_portals) on meta-wiki. After these templates are updated, the pages need to be pulled into this repository for deployment.

## Getting Started

- [CONTRIBUTING.md](./CONTRIBUTING.md) contains a brief overview and quickstart guide for contributing code to this repository.
- [Technical Documentation](./docs/README.md) contains a detailed description of all the various aspects of development for this project, including getting started through to deployment.
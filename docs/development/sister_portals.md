# Wikipedia.org technical Documentation
**TOC**

- [Overview](../README.md)
- Architecture of www.wikipedia.org
	- [Data sources](../architecture/data.md)
	- [l10n](../architecture/l10n.md)
	- [HTML](../architecture/html.md)
	- [CSS](../architecture/css.md)
	- [Images](../architecture/images.md)
	- [JS](../architecture/javascript.md)
- Development Process
	- [Getting Started](getting_started.md)
	- [Gulp Tasks](gulp.md)
	- [Production Builds](prod.md)
	- [Deployment](deploy.md)
	- **Sister Project Portals**

---

## Updating sister project portals

The portals for sister projects are not updated in the same way as the wikipedia.org portal. These portal pages are still updated through Lua templates on mediawiki.org. They are however, deployed to production in the same way as the wikipedia.org portal (see the [deployment](deploy.md) section for details). This sub optimal arrangement was settled upon due to the resource constraints at the Wikimedia Foundation, where efforts were focused on updating the wikipedia.org portal only.

### Sister project templates
[The Project portals](https://meta.wikimedia.org/wiki/Project_portals) page on metawiki has links to the templates used to update the sister project portals. The main template used to generate these portals is [Module:Project_portal](https://meta.wikimedia.org/wiki/Module:Project_portal), which takes the list of wikis from [Module:Project_portal/wikis](https://meta.wikimedia.org/wiki/Module:Project_portal/wikis) and stats for those wikis from [Module:Project_portal/views](https://meta.wikimedia.org/wiki/Module:Project_portal/views).

Administrator access is required to update these templates. Once an administrator has made updates to these portals, they are pulled into the repository with the gulp task `gulp fetch-meta --portals=all`. They can then be committed to Gerrit for deployment.
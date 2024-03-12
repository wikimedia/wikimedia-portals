const fs = require("fs"),
  deleteFiles = require("./utils"),
  /**
   * Number of days to generate the stats over
   */
  DAYS = 7,
  codeMapping = {
    b: "wikibooks",
    d: "wiktionary",
    f: "foundationwiki",
    m: "",
    mw: "wiki",
    n: "wikinews",
    q: "wikiquote",
    s: "wikisource",
    v: "wikiversity",
    voy: "wikivoyage",
    w: "wiki",
    wd: "wikidatawiki",
    zero: "",
  };

//the second arg here "expectedResponseDataType" speifies the type of data you are expecting from get request
//if expecting text, pass "text" as the second parameter
function httpGet(url, expectedResponseDataType = "json") {
  const headers = new Headers({
    "User-Agent": "Wikimedia portals updater",
  });

  return fetch(url, { headers })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      //convert the response into the expected data type
      switch (expectedResponseDataType.toLowerCase()) {
        case "text":
          return response.text();
        case "json":
          return response.json();
        default:
          Promise.reject(
            `passed expectedResponseDataType ${expectedResponseDataType} does not match any available options {json, text}`
          );
      }
    })
    .catch((err) => {
      // I can haz error message that makes sense?
      const msg = err.toString() + " requesting " + url;
      console.error(msg); // eslint-disable-line no-console
      Promise.reject(msg);
    });
}

function getPageCounts() {
  // eslint-disable-next-line no-constant-condition
  if (process.env.MEDIAWIKI_DEPLOYMENT_DIR && false) {
    // Production
    // TODO:
  } else {
    // Developer's machine
    return httpGet("https://pagecounts.toolforge.org/pagecounts.json").then(
      (pagecounts) => {
        var stats = {};

        Object.entries(pagecounts).forEach(([code, wiki]) => {
          code = code.replace(/_/g, "-");
          stats[code] = wiki.contentPages;
        });
        return stats;
      }
    );
  }
}

function getSiteMatrix() {
  return httpGet(
    "https://meta.wikimedia.org/w/api.php?action=sitematrix&format=json&smtype=language&smlangprop=code%7Csite&smsiteprop=url%7Cdbname%7Ccode"
  );
}

function parseProjectString(str) {
  var parts = str.split(".").filter((part) => part !== "m" && part !== "zero"),
    name = parts.shift();
  if (codeMapping[name]) {
    return codeMapping[name];
  }

  if (parts.length) {
    if (!codeMapping[parts[0]]) {
      throw "Cannot parse wiki " + str; // eslint-disable-line no-throw-literal
    }
    name += codeMapping[parts[0]];
  } else {
    name += "wiki";
  }
  if (parts.length > 1) {
    throw "Cannot parse wiki " + str; // eslint-disable-line no-throw-literal
  }
  return name;
}

function generateFileList(days) {
  const list = [],
    currentDate = new Date();

  for (let d = 0; d < days; d++) {
    currentDate.setDate(currentDate.getDate() - 1); // Subtract a day

    const year = currentDate.getFullYear();
    const month = (currentDate.getMonth() + 1).toString().padStart(2, "0");
    const day = currentDate.getDate().toString().padStart(2, "0");

    const baseUrl =
      "https://dumps.wikimedia.org/other/pageviews/" +
      year +
      "/" +
      year +
      "-" +
      month +
      "/";
    const baseName = "projectviews-" + year + month + day;

    for (let i = 0; i <= 23; i++) {
      const file = baseName + "-" + (i < 10 ? "0" : "") + i.toString() + "0000";
      list.push({ file: file, url: baseUrl + file });
    }
  }

  return list;
}

function garbageCollect() {
  deleteFiles(__dirname + "/../cache/", DAYS + 2);
}

function getViewsData() {
  var list = generateFileList(DAYS),
    stats = [],
    promise = Promise.resolve();

  if (!fs.existsSync("cache")) {
    fs.mkdirSync("cache");
  }
  garbageCollect();

  // Go synchronously to avoid hitting throttling on the server
  list.forEach((hour) => {
    var fileName = "cache/" + hour.file,
      content;
    try {
      content = fs.readFileSync(fileName, { encoding: "utf8" });
      stats.push(content);
    } catch (ex) {
      if (!content) {
        promise = promise
          .then(() => httpGet(hour.url, "text"))
          .then((text) => {
            if (!text) {
              return;
            }
            fs.writeFileSync(fileName, text);
            stats.push(text);
          })
          .catch((err) => console.log(err.message));
      }
    }
  });

  return promise.then(() => stats);
}

function getProjectViews() {
  return getViewsData()
    .then((hourlies) => {
      let views = {};

      hourlies.forEach((hourly) => {
        let lines;
        if (!hourly) {
          return;
        }
        lines = hourly.toString().split("\n");
        lines.forEach((line) => {
          const parts = line.split(/\s+-?\s*/),
            wiki = parseProjectString(parts[0]);
          views[wiki] = views[wiki] || 0;
          views[wiki] += parseInt(parts[1], 10);
        });
      });
      if (!views) {
        // We permit some hourly files to fail to be downloaded, but all of them missing
        // Is a sign of a problem
        return Promise.reject(
          "No hourly project views file was successfully loaded"
        );
      }
      return views;
    })
    .catch(() => {}); // Do nothing, last file can be being generated right now
}

function getSiteStats() {
  var stats = {};

  return Promise.all([
    getPageCounts(),
    getSiteMatrix(),
    getProjectViews(),
  ]).then((data) => {
    var counts = data[0],
      siteMatrix = data[1].sitematrix,
      views = data[2];

    Object.entries(siteMatrix).forEach(([propName, lang]) => {
      if (!/^\d+$/.test(propName)) {
        return; // Not a language... Fuck, this API's output is ugly
      }
      Object.values(lang.site).forEach((site) => {
        var dbname = site.dbname.replace(/_/g, "-");
        stats[site.code] = stats[site.code] || {};
        stats[site.code][lang.code] = {
          url: site.url,
          numPages: counts[dbname] || 0,
          views: views[dbname] || 0,
          closed: site.closed !== undefined,
        };
      });
    });

    return stats;
  });
}

module.exports = {
  getSiteStats: getSiteStats,
  parseProjectString: parseProjectString,
};

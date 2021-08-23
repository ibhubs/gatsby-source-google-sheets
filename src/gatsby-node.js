"use strict";

const fetchSheet = require(`./fetch-sheet.js`).default;
const uuidv5 = require("uuid/v5");
const _ = require("lodash");
const crypto = require("crypto");
const { stringify } = require("flatted/cjs");
const seedConstant = "2972963f-2fcf-4567-9237-c09a2b436541";

exports.sourceNodes = async ({ boundActionCreators, getNode, store, cache }, { spreadsheetId, worksheetTitle, credentials }) => {
  const { createNode } = boundActionCreators;
  console.log("FETCHING SHEET", spreadsheetId);
  let {rows, sheetTitle} = await fetchSheet(spreadsheetId, worksheetTitle, credentials);


  rows.forEach(r => {
    createNode({
      ...r,
      id: uuidv5(r.name, uuidv5("gsheet", seedConstant)),
      parent: "__SOURCE__",
      children: [],
      internal: {
        type: _.camelCase(`googleSheet ${sheetTitle} row`),
        contentDigest: crypto.createHash("md5").update(stringify(r)).digest("hex")
      }
    });
  });
};

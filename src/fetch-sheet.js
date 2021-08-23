"use strict";

exports.__esModule = true;
const { GoogleSpreadsheet } = require("google-spreadsheet");
const _ = require("lodash");

const getSpreadsheet = (spreadsheetId, credentials) => new Promise(async (resolve, reject) => {
  const doc = new GoogleSpreadsheet(spreadsheetId);
  await doc.useServiceAccountAuth({
    client_email: credentials.client_email,
    private_key: credentials.private_key
  });
  resolve(doc);
});

const getWorksheetByTitle = (spreadsheet, worksheetID) => new Promise(async (resolve, reject) => {
  console.log('workSheetId', worksheetID);
  const workSheet = await spreadsheet.sheetsById[worksheetID];
  resolve(workSheet);
});

const getRows = (worksheet, options = {}) => new Promise((resolve, reject) => resolve(worksheet.getRows()));

const cleanRows = rows => {
  const columnTypes = guessColumnsDataTypes(rows);
  return rows.map(r => _.chain(r).omit(["_xml", "app:edited", "save", "del", "_links"]).mapKeys((v, k) => _.camelCase(k)).mapValues((val, key) => {
    switch (columnTypes[key]) {
      case "number":
        console.log('value', val);
        // return Number(val.replace(/,/g, ""));
        return val;
      case "boolean":
        // when column contains null we return null, otherwise check boolean value
        return val === null ? null : val === "TRUE";
      default:
        return val;
    }
  }).value());
};

const guessColumnsDataTypes = rows => _.flatMap(rows, r => _.chain(r).omit(["_xml", "app:edited", "save", "del", "_links"]).mapKeys((v, k) => _.camelCase(k)).mapValues(val => {
  // try to determine type based on the cell value
  if (!val) {
    return "null";
  } else if (val.replace(/[,\.\d]/g, "").length === 0) {
    // sheets apparently leaves commas in some #s depending on formatting
    return "number";
  } else if (val === "TRUE" || val === "FALSE") {
    return "boolean";
  } else {
    return "string";
  }
}).value()).reduce((columnTypes, row) => {
  _.forEach(row, (type, columnName) => {
    // skip nulls, they should have no effect
    if (type === "null") {
      return;
    }

    const currentTypeCandidate = columnTypes[columnName];
    if (!currentTypeCandidate) {
      // no discovered type yet -> use the one from current item
      columnTypes[columnName] = type;
    } else if (currentTypeCandidate !== type) {
      // previously discovered type is different therefore we fallback to string
      columnTypes[columnName] = "string";
    }
  });
  return columnTypes;
}, {});

const fetchData = async (spreadsheetId, worksheetTitle, credentials) => {
  const spreadsheet = await getSpreadsheet(spreadsheetId, credentials);
  await spreadsheet.loadInfo();
  const worksheet = await getWorksheetByTitle(spreadsheet, worksheetTitle);
  const sheetTitle = await worksheet.title;
  const rows = await worksheet.getRows();
  // return cleanRows(rows);
  return {rows, sheetTitle};
};

exports.cleanRows = cleanRows;
exports.guessColumnsDataTypes = guessColumnsDataTypes;
exports.default = fetchData;
const { graphql, buildSchema, printSchema } = require("graphql");
const {
  jsonToSchema,
  stringifySchema,
} = require("@walmartlabs/json-to-simple-graphql-schema/lib");
const merge = require("lodash.merge");

const flattenArrays = (obj) => {
  if (!Array.isArray(obj)) {
    if (typeof obj === "object" && obj !== null) {
      return Object.fromEntries(
        Object.entries(obj).map(([key, val]) => {
          return [key, flattenArrays(val)];
        })
      );
    } else {
      return obj;
    }
  } else {
    const first = obj[0];
    if (first && typeof first === "object" && first !== null) {
      return [merge(...obj)];
    } else {
      return obj;
    }
  }
};

function gqlFilter(obj, query) {
  try {
    const data = flattenArrays(JSON.parse(JSON.stringify(obj)));
    const schema = buildSchema(
      `
    type Query {
      root: Base 
    }
    ${
      jsonToSchema({
        jsonInput: JSON.stringify(data),
        baseType: "Base",
      }).value
    }
  `
    );
    printSchema(schema);
    return graphql(
      schema,
      `
      {
        root ${query}
      }
    `,
      { root: () => obj }
    ).then((res) => {
      if (res.errors) {
        return Promise.reject(res.errors);
      }
      return res.data.root;
    });
  } catch (e) {
    return Promise.reject(e);
  }
}
const bulkFilter = async (obj, filters) => {
  const entries = Object.entries(obj);
  const promises = entries.map(([key, val]) => {
    let data = val;
    let filter = filters[key];
    if (Array.isArray(val)) {
      data = { arr: val };
      filter = `{arr ${filter}}`;
    }
    return gqlFilter(data, filter)
      .then((res) => {
        if (Array.isArray(val)) {
          return res.arr;
        }
        return res;
      })
      .catch((e) => {
        console.error(e);
        return val;
      });
  });
  const result = await Promise.all(promises);
  return Object.fromEntries(entries.map(([key], i) => [key, result[i]]));
};

module.exports = gqlFilter;
module.exports.bulkFilter = bulkFilter;

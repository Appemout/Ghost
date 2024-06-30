// # aeo_extract_data Helper
//
// Usage:  `{{aeo_extract_data content sectionTitle key}}`
// Example: `{{aeo_extract_data (content) "Links" "website_link"}}`
//
// Returns the extracted string

const { SafeString } = require("../services/handlebars");
const Handlebars = require("handlebars");

function isNumeric(str) {
  if (typeof str != "string") return false // we only process strings!  
  // @ts-ignore
  return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
         !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
}

module.exports = function aeo_extract_data(contentToSearch, options) {
    // eslint-disable-line camelcase
    // console.log(
    //     "aeo_extract_data",
    //     "contentToSearch",
    //     contentToSearch,
    //     "options.hash",
    //     options.hash,
    // );
    let extractedString = "";

    if (!contentToSearch) {
      return new SafeString(extractedString);
    }

    var attributes = {};

    Object.keys(options.hash).forEach(key => {
      var escapedKey = Handlebars.escapeExpression(key);
      var escapedValue = options.hash[key];
      if (typeof escapedValue === "string") {
        escapedValue = Handlebars.escapeExpression(escapedValue);
      }
      if (isNumeric(escapedValue)) {
        attributes[escapedKey] = Number(escapedValue);
      } else {
        attributes[escapedKey] = escapedValue;
      }
    });

    if (!attributes.sectionTitle || !attributes.keyToSearch) {
        return new SafeString(extractedString);
    }

    const contentStr = contentToSearch.toHTML();
    const sectionRegex = new RegExp(`${attributes.sectionTitle}([\\s\\S]*?)(\\n\\n|$)`); // Matches the specified section
    const match = contentStr.match(sectionRegex);
    if (match && match.length > 1) {
        const sectionContent = match[1];
        // Escape any special characters in the label to avoid issues in the regex
        const escapedKey = attributes.keyToSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        // Construct the regex pattern
        const keyValuePattern = attributes.isUrl
            ? `<li>${escapedKey}:\\s*(https?:\\/\\/[^\\s]+)<\\/li>`
            : attributes.isPhoneNumber
            ? `<li>${escapedKey}:\\s*([\\+\\d\\s\\(\\)-]+)<\\/li>`
            : `<li>${escapedKey}:\\s*([^<]+)<\\/li>`;
        // Create a case-insensitive regex object
        const keyValueRegex = new RegExp(keyValuePattern, "i");
        // Get the matches for the regex
        const valueMatch = sectionContent.match(keyValueRegex);
        extractedString = (valueMatch && valueMatch.length > 1) ? valueMatch[1] : "";
    }
    return new SafeString(extractedString);
};

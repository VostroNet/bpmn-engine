'use strict';

const getPropertyValue = require('./getPropertyValue');

const isExpressionPattern = /^\${(.+?)}$/;
const expressionPattern = /\${(.+?)}/;
const expressionCondition = /[><!=]/;

function resolveExpressions(templatedString, context) {
  let result = templatedString;
  while (expressionPattern.test(result)) {
    const expressionMatch = result.match(expressionPattern);
    const innerProperty = expressionMatch[1];

    if (innerProperty === 'true') {
      return true;
    } else if (innerProperty === 'false') {
      return false;
    }

    let contextValue = getPropertyValue(context, innerProperty);

    if (expressionMatch.input === expressionMatch[0]) {
      return contextValue;
    }

    if (typeof contextValue === 'string') {
      contextValue = '"' + contextValue + '"';
    }
    result = result.replace(expressionMatch[0], contextValue === undefined ? '' : contextValue );
  }
  if (expressionCondition.test(result)) {
    return eval(result);
  }
  return result;
}

resolveExpressions.isExpression = function(text) {
  if (!text) return false;
  return isExpressionPattern.test(text);
};

resolveExpressions.hasExpression = function(text) {
  if (!text) return false;
  return expressionPattern.test(text);
};

module.exports = resolveExpressions;

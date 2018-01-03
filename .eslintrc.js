module.exports = {
  "env": {
    "node": true,
    "es6": true
  },
  "parser": "babel-eslint",
  "rules": {
    "quotes": [2, "single"],
    "semi": 2,
    "max-len": [1, 150, 2],
    "arrow-body-style": [1, "as-needed"],
    "comma-dangle": [2, "never"],
    "object-curly-spacing": 0,
    "no-console": 0,
    "no-continue": 0,
    "no-bitwise": 0,
    "no-param-reassign": [0, {"props": false}],
    "no-throw-literal": 1,
    "consistent-return": 0,
    "prefer-rest-params": 0
  },
  "extends": "airbnb-base"
}

module.exports = {
  presets: [
    ["@babel/preset-env", {
      targets: {
        electron: "2.1.12",
        node: "7"
      }
    }]
  ]
}

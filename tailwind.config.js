module.exports = {
  darkMode: 'media',
  content: ["./site/**/*.{html,js}", "./node_modules/flowbite/**/*.js", "./views"],
  theme: {
    extend: {},
  },
  plugins: [
    require('flowbite/plugin')
  ],
}

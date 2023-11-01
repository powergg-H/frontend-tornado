/** @type {import('next').NextConfig} */
// let basePath = ""
// if (process.env.NODE_ENV === 'production') {
//     basePath="/build"
// }
const nextConfig = {
    distDir: 'build',
    output: 'export',
    // i18n: {
    //     // The locales you want to support in your app
    //     locales: ["cn", "tw","en"],
    //     // The default locale you want to be used when visiting a non-locale prefixed path e.g. `/hello`
    //     defaultLocale: "en",
    // },
    // basePath:basePath
    // webpack(config) {
    //     // if (process.env.NODE_ENV === 'production') {
    //     //     config.plugins.push( new UglifyJsPlugin({

    //     //     }),)

    //     // }
    //     config.output={
    //         publicPath:"./"
    //     }

}

module.exports = nextConfig

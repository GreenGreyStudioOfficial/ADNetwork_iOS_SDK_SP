// swift-tools-version:5.3
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "ADNetworkSDK",
    platforms: [.iOS(.v13)],
    products: [
        .library(
            name: "ADNetworkSDK",
            targets: ["ADNetworkSDK"]
        ),
    ],
    targets: [
        .binaryTarget(
            name: "ADNetworkSDK",
            path: "./Sources/ADNetworkSDK.xcframework"
        )
    ],
    swiftLanguageVersions: [.v5]
)

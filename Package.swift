// swift-tools-version:5.3
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "ADNetworkSDKPackage",
    products: [
        .library(
            name: "ADNetworkSDKPackage",
            targets: ["ADNetworkSDKPackage"]
        ),
    ],
    targets: [
        .binaryTarget(
            name: "ADNetworkSDKPackage",
            path: "./Sources/ADNetworkSDK.xcframework"
        )
    ]
)

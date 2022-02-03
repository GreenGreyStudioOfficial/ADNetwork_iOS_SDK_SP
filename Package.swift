// swift-tools-version:5.5
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "ADNetworkSDK_SP",
    products: [
        // Products define the executables and libraries a package produces, and make them visible to other packages.
        .library(
            name: "ADNetworkSDK_SP",
            targets: ["ADNetworkSDK_SP"]),
    ],
    dependencies: [
        // Dependencies declare other packages that this package depends on.
        // .package(url: /* package url */, from: "1.0.0"),
    ],
    targets: [
        // Targets are the basic building blocks of a package. A target can define a module or a test suite.
        // Targets can depend on other targets in this package, and on products in packages this package depends on.
        .target(
            name: "ADNetworkSDK_SP",
            dependencies: []),
        .testTarget(
            name: "ADNetworkSDK_SPTests",
            dependencies: ["ADNetworkSDK_SP"]),
    ]
)

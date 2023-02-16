Pod::Spec.new do |s|
  s.name             = 'ADNetworkSDK'
  s.version          = '1.0'
  s.summary          = 'Mobidriven SDK'

  s.homepage         = 'https://github.com/GreenGreyStudioOfficial/ADNetwork_iOS_SDK_SP'
  s.license          = { :type => 'MIT', :file => 'LICENSE.md' }
  s.author           = { 'Mobidriven' => 'info@mobidriven.com' }
  s.source           = { :git => 'https://github.com/GreenGreyStudioOfficial/ADNetwork_iOS_SDK_SP.git', :tag => s.version.to_s }

  s.ios.deployment_target = '13.0'
  s.swift_version = '5.0'

  s.source_files = 'Sources/ADNetworkSDK/**/*'
end

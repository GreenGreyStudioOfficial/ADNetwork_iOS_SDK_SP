/*
 * promo.js
*/


// Utility
function createElement(tag, className, idName) {
  const element = document.createElement(tag);
  if (className) element.classList.add(className);
  if (idName) element.id = idName;
  return element
}

// Alert
function AlertView(options) {
  var instance = this,
    containerId = options.containerId,
    okAction = options.onOk || function () {},
    cancelAction = options.onCancel|| function () {};

  this.show = function () {
      let promo = document.getElementById(containerId);
      let background = createElement("div",undefined, "AlertViewBackground");
      promo.appendChild(background);
      
      let container = createElement("div", "AlertViewContainer");
      background.appendChild(container);
      
      let titleLabel = createElement("h3", "AlertViewTitleLabel");
      container.appendChild(titleLabel);
      titleLabel.textContent = "При закрытии ролика награда не будет начислена";
      
      let buttonsContainer = createElement("div", "AlertViewButtonsContainer");
      container.appendChild(buttonsContainer);
      
      let okButton = createElement("h4", "AlertViewButton");
      buttonsContainer.appendChild(okButton);
      okButton.textContent = "Ок";
      
      let cancelButton = createElement("h4", "AlertViewButton");
      buttonsContainer.appendChild(cancelButton);
      cancelButton.textContent = "Отменить";
      
      okButton.addEventListener("click", function () {
          okAction();
          instance.hide();
      });
      
      cancelButton.addEventListener("click", function () {
          cancelAction();
          instance.hide();
      });
  };

  this.hide = function () {
      let view = document.getElementById("AlertViewBackground");
      view.innerHTML = "";
      view.remove();
  };
}

// Countdown
function Countdown(options) {
  var timer,
  isPaused = false,
  instance = this,
  seconds = options.seconds || 10,
  updateStatus = options.onUpdateStatus || function () {},
  counterEnd = options.onCounterEnd || function () {};

  function decrementCounter() {
      if(!isPaused) {
        updateStatus(seconds);
        if (seconds === 0) {
          counterEnd();
          instance.stop();
        }
        seconds--;
      }
  }
    
    this.pause = function() {
        isPaused = true;
    }
    
    this.resume = function() {
        isPaused = false;
    }

  this.start = function () {
    clearInterval(timer);
    timer = 0;
    seconds = options.seconds;
    timer = setInterval(decrementCounter, 1000);
  };

  this.stop = function () {
    clearInterval(timer);
  };
}

// Video player
function Player (containerId, data){
    //console.log("Player in container: " + containerId);
    this.data = data;
    this.currentTime = undefined;
    this.videoDuration = undefined;
    
    this.impression = undefined;
    this.midpoint = undefined;
    this.firstQuartile = undefined;
    this.midpoint = undefined;
    this.thirdQuartile = undefined;
    this.complete = undefined;
    this.containerId = containerId;
    
    let container = document.getElementById(containerId);
    let video = document.createElement("video");
    video.className = "videoView";
    video.id = `video-${containerId}`;
    video.autoplay = true//containerId == "0";
    video.muted = true;
    video.playsinline = true;
    video.webkitPlaysinline = true;
    video.controls = false;
    video.preload = "metadata";
    video.setAttribute('playsinline',"playsinline");
    container.appendChild(video);

    let that = this;
    
    video.onloadedmetadata = function() {
        //console.log("video.onloadedmetadata");
        that.videoDuration = Math.round(this.duration);
        this.currentTime = that.currentTime ? that.currentTime : 0;
    }
    
    video.oncanplaythrough = function() {
        //console.log("video.oncanplaythrough");

    }

    video.addEventListener("click", function(event) {
      this.muted = !this.muted;
    });

    video.addEventListener('timeupdate', function(event) {
      that.currentTime = this.currentTime;
      const progress = Math.round(this.currentTime/that.videoDuration*100)/100;
                                  
      if (!that.impression && (this.currentTime >= data.impTrackingTimeout/1000)) {
        that.impression = progress;
        this.dispatchEvent(new CustomEvent("playBackEvent", {bubbles: true,detail:{type: "impression"}}));
      }
                                  
      if (!that.firstQuartile && (progress >= 0.24 && progress <= 0.26)) {
        that.firstQuartile = progress;
        this.dispatchEvent(new CustomEvent("playBackEvent", {bubbles: true,detail:{type: "firstQuartile"}}));
      }

      if (!that.midpoint && (progress >= 0.49 && progress <= 0.51)) {
        that.midpoint = progress;
        this.dispatchEvent(new CustomEvent("playBackEvent", {bubbles: true,detail:{type: "midpoint"}}));
      }

      if (!that.thirdQuartile && (progress >= 0.74 && progress <= 0.76)) {
        that.thirdQuartile = progress;
        this.dispatchEvent(new CustomEvent("playBackEvent", {bubbles: true,detail:{type: "thirdQuartile"}}));
      }

      if (!that.complete && progress >= 0.99) {
        that.complete = progress;
        this.dispatchEvent(new CustomEvent("playBackEvent", {bubbles: true,detail:{type: "complete"}}));
      }

    });
        
    this.update = function update(landscapeMode) {
      let video = document.getElementById(`video-${this.containerId}`);
      let continuePlay = !(video.paused || video.ended)
      
      //let inline = "?playsinline=1";
      let videoFile = landscapeMode ? this.data.videoLandscapeUrl : this.data.videoPortraitUrl;
      //console.log("MODE: " + landscapeMode + ", SET VIDEO SRC: " + videoFile);
      video.src = videoFile;
      video.currentTime = this.currentTime ? this.currentTime : 0;
      if (continuePlay === true) {
          video.play()
      }
    }
}



// ERROR EVENT LISTENER
(function(){
    window.addEventListener("error", function(m){
        console.log(m);
        var r = new XMLHttpRequest();
        var url = "https://sp-01.mobidriven.com/mraid_error";
        url += "?msg=" + encodeURIComponent(m.message);
        url += "&file=" + encodeURIComponent(m.filename);
        url += "&line=" + encodeURIComponent(m.lineno);
        url += "&col=" + encodeURIComponent(m.colno);
        url += "&trace=" + encodeURIComponent(m.error ? m.error.stack : "");
        r.open("GET", url, true);
        r.setRequestHeader("Content-Type", "application/json");
        r.send();
    }, false);
})();


var swipeViewId = "swipeView";
var framesData = [];
var framesDataReformated = [];
var visibleFrameIndex = 0;
var players = [];
var landscapeMode = false;
var rewardCounter = undefined;
var mediaCache = undefined;

var isIOS = (function () {
    var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    var isAppleDevice = navigator.userAgent.includes('Macintosh');
    var isTouchScreen = navigator.maxTouchPoints >= 1;

    return isIOS || (isAppleDevice && isTouchScreen);
})();

function doMraidReadyCheck(){
    if (mraid.getState() == 'loading') {
        mraid.addEventListener("ready", mraidIsReady);
    }
    else {
        //showMyAd();
        downloadMedia();
    }
}

function mraidIsReady()
{
    console.log("mraidIsReady!")
    mraid.removeEventListener("ready", mraidIsReady);
    //showMyAd();
    downloadMedia();
}

function initPromoApp() {
    console.log('Promo app started');
    framesData = data.frames;
    reformatData();
    doMraidReadyCheck();
}

function addMraidEventListeners() {
    mraid.addEventListener("sizeChange", updateUI);
    mraid.addEventListener("orientationChange", updateUI);
    mraid.addEventListener("viewableChange", updateVisiblePlayerState);
    mraid.addEventListener("exposureChange", updateVisiblePlayerState);
}
                           
// Reformat frames data
function reformatData() {
    var videoFrames = [];
    var imageFrames = [];
    for(var i = 0; i < framesData.length; i++) {
        let fr = framesData[i];
        if (fr.type === "VideoPlayer") {
            videoFrames.push(fr);
        }
        else if (fr.type === "ImageCard" && imageFrames.length == 0) {
            imageFrames.push(fr);
        }
    }
    framesDataReformated = videoFrames.concat(imageFrames);
}
                           
                           
// Preload media data
function downloadMedia() {
    if (framesData && framesData.length > 0) {
        var counter = 0;
        framesData.forEach(function(frameData,index){
            preloadMediaForFrame(index, function(){
                counter = counter + 1;
                if (counter === framesData.length) {
                    if (mraid.supports && mraid.supports("sdk")){
                        console.log("Modidriven SDK. AD preloaded and ready to show");
                    }
                    else {
                        showMyAd();
                    }
                    mraid.sendContentReadyEvent(true)
                }
            });
        })
    }
}
                           
function preloadMediaForFrame(index, onComplete) {
    console.log("preloadMedia for frame: " + index);
    var frame = framesData[index];
    var d1,d2 = undefined;
        
    if (frame.type == "VideoPlayer") {
        
        if (frame.videoPortraitUrl) {
            downloadFile(frame.videoPortraitUrl,function(localUrl){
                d1 = localUrl !== undefined;
                frame.videoPortraitUrl = d1 ? localUrl : frame.videoPortraitUrl;
                if (allMediaDownloaded() === true) {
                    onComplete();
                }
            });
        }
        if (frame.videoLandscapeUrl) {
            downloadFile(frame.videoLandscapeUrl,function(localUrl){
                d2 = localUrl !== undefined;
                frame.videoLandscapeUrl = d2 ? localUrl : frame.videoLandscapeUrl;
                if (allMediaDownloaded() === true) {
                    onComplete();
                }
            });
        }
    }
    else if (frame.type == "ImageCard") {
        if (frame.imagePortraitUrl) {
            downloadFile(frame.imagePortraitUrl,function(localUrl){
                d1 = localUrl !== undefined;
                frame.imagePortraitUrl = d1 ? localUrl : frame.imagePortraitUrl;
                if (allMediaDownloaded() === true) {
                    onComplete();
                }
            });
        }
        if (frame.imageLandscapeUrl) {
            downloadFile(frame.imageLandscapeUrl,function(localUrl){
                d2 = localUrl !== undefined;
                frame.imageLandscapeUrl = d2 ? localUrl : frame.imageLandscapeUrl;
                if (allMediaDownloaded() === true) {
                    onComplete();
                }
            });
        }
    }
        
    function allMediaDownloaded() {
        return d1 !== undefined && d2 !== undefined;
    }
                
        
    function downloadFile(url,completionHandler) {
        var http = new XMLHttpRequest();
        http.open('GET', url,true);
        http.responseType = 'blob';
        http.onload = function() {
            if (this.status === 200|| this.status == 0) {
                const localUrl = URL.createObjectURL(this.response);
                //console.log("File downloaded: " + localUrl);
                completionHandler(localUrl);
            }
        }
        
        http.onerror = function(error){
            console.log("DOWNLOAD ERROR for file: " + url);
            console.log(error);
            completionHandler()
        }
        
        http.send();
    }
}
                           

// Build UI
function showMyAd() {
    addMraidEventListeners();
        
    let promo = document.getElementById('promo');

    let swipeView = createElement("div","swipeView", swipeViewId);
    swipeView.style.gridTemplateColumns = `repeat(${framesDataReformated.length}, 100%)`;
    promo.appendChild(swipeView);
        
    if (typeof mraid.getBigScreen === "function") {
        let bigScreen =  mraid.getBigScreen();
        if (bigScreen) {
            calculateViewSizeForIOS(swipeView);
        }
    }

    if (framesData) {
       buildFrames();
    }
                
    // Close button
    if (mraid.supports && mraid.supports("sdk")){
        
        let firstFrame = framesDataReformated[0];

        let closeButtonContainer = createElement("div","closeButtonContainer", "closeButtonContainer");
        promo.appendChild(closeButtonContainer);
        
        let closeButton = createElement("img","closeButton", "closeButton");
        closeButtonContainer.appendChild(closeButton);
        
        var closeButtonImage = "https://files.mobidriven.com/players/promo/images/close_rect.png";
        if (firstFrame && firstFrame.type == "ImageCard") {
            closeButtonImage = "https://files.mobidriven.com/players/promo/images/close.png";
            closeButton.classList.remove("closeButton");
            closeButton.classList.add("closeButtonBanner");
        }
        closeButton.src = closeButtonImage;
        
        
        closeButton.addEventListener("click", function(event) {
          closeAction(visibleFrameIndex);
        });
        
        
        
        if (typeof mraid.getRewarded === "function" && mraid.getRewarded() === true){
            let visibleFrame = framesDataReformated[visibleFrameIndex];
            // Add counter label
            let counterLabel = createElement("h5","closeButtonCounterLabel", "closeButtonCounterLabel");
            closeButtonContainer.appendChild(counterLabel);
            let startCount = visibleFrame.impTrackingTimeout/1000;
            counterLabel.textContent = `${startCount}`;
            
            counterLabel.style.marginRight = visibleFrame.type == "ImageCard" ? "60px" : "20px";
            
            // Add counter
            myCounter = new Countdown({
                seconds:visibleFrame.impTrackingTimeout/1000,
                onUpdateStatus: function(sec){
                    rewardCounter = sec;
                    counterLabel.textContent = `${sec}`;
                },
                onCounterEnd: function(){
                    rewardCounter = undefined;
                    counterLabel.style.opacity = 0;
                }
            });

            myCounter.start();
        }
        
    }
        
    updateUI();
}
                           
function calculateViewSizeForIOS (element) {
    var height = "100vh";
    var width = "100vw";
    if (landscapeMode === true) {
        width = "calc(100vw - 100px)";
    }
    else {
        height = "calc(100vh - 100px)";
    }
    
    element.style.height = height;
    element.style.width = width;
}


function buildFrames() {

    framesDataReformated.forEach(function (frameData, index){
        buildFrame(frameData,index);
    })
    
    if (!mraid.isViewable()) {
        mraid.addEventListener("viewableChange", function onVisible(){
            if (mraid.isViewable() == true) {
                mraid.removeEventListener("viewableChange", onVisible);
                updateOnSwipe();
            }
        });
    }
    else {
        updateOnSwipe();
    }

    document.getElementById(swipeViewId).addEventListener('scroll', function() {
        updateOnSwipe();
    });

}

function buildFrame(frameData,index) {
  switch (frameData.type) {
    case "VideoPlayer":
      buildVideoPlayer(frameData,index);
      break;
    case "ImageCard":
      buildImageCard(frameData,index);
      break;
    default:
      break;
  }
}

function buildVideoPlayer(data,index) {
    console.log("buildVideoPlayer: " + index);
    let frameView = createElement("div","frameView",`${index}`);
    document.getElementById(swipeViewId).appendChild(frameView);
        
    if (typeof mraid.getBigScreen === "function") {
        let bigScreen =  mraid.getBigScreen();
        if (bigScreen) {
            calculateViewSizeForIOS(frameView);
        }
    }
        
    frameView.classList.add("videoFrame");
        
        
  let player = new Player(frameView.id, data);
  players.push(player);

  document.addEventListener("playBackEvent", function(ev) {
    var event = {};
    event.type = ev.detail.type;
    event.urls = [];
    if (ev.detail.type === "impression") {
        event.urls = data.impTracking;
    }
    else {
        data.eventTracking.forEach(function (evtr){
          if (evtr.event === event.type) {
            event.urls.push(evtr.url);
          }
        })
    }
    fireEvent(event);
  });

  let overlayView = createElement("div","overlayView");
  frameView.appendChild(overlayView);

  let topButtonsContainer = createElement("div","topButtonsContainer");
  overlayView.appendChild(topButtonsContainer);

  // Info button
  let infoButtonView = createElement("img","infoButtonVideo");
  infoButtonView.src = "https://files.mobidriven.com/players/promo/images/info.png";
  infoButtonView.addEventListener("click", function(event) {
    clickAction(index, false);
  });
  topButtonsContainer.appendChild(infoButtonView);

  // AD Logo
  if (data.logoImageUrl) {
    let logoAd = createElement("img", "logoAd");
    logoAd.src = data.logoImageUrl;
    logoAd.addEventListener("click", function (event) {
      clickAction(index, false);
    });
    topButtonsContainer.appendChild(logoAd);
  }

  let bottomButtonsContainer = createElement("div","bottomButtonsContainer");
  overlayView.appendChild(bottomButtonsContainer);

  // GG Logo
  let logo = createElement("img","logoGGvideo");
  logo.src = "https://files.mobidriven.com/players/promo/images/gg_black.png";
  logo.addEventListener("click", function(event) {
    clickAction(index, false);
  });
  bottomButtonsContainer.appendChild(logo);

  // Swipe button
  if (framesDataReformated.length > 1 && index === 0) {
    let swipeButtonView = createElement("img","swipe");
    swipeButtonView.src = "https://files.mobidriven.com/players/promo/images/swipe.png";
    bottomButtonsContainer.appendChild(swipeButtonView);
  }
}

function buildImageCard(data,index) {
    console.log("buildImageСard: " + index);
    let frameView = createElement("div","frameView",`${index}`);
    document.getElementById(swipeViewId).appendChild(frameView);
        
    if (typeof mraid.getBigScreen === "function") {
        let bigScreen =  mraid.getBigScreen();
        if (bigScreen) {
            calculateViewSizeForIOS(frameView);
        }
    }
        
    frameView.classList.add("imageFrame");
        
    let borderView = createElement("div",undefined, "bgBorderView");
    frameView.appendChild(borderView);
        
    let wrapperView = createElement("div",undefined, "imageСard");
    frameView.appendChild(wrapperView);
        
        
    let bannerArea = createElement("div", undefined, "bannerArea");
    let buttonsArea = createElement("div", undefined, "buttonsArea");
        
    wrapperView.appendChild(bannerArea);
    wrapperView.appendChild(buttonsArea);
        
        
    // Banner
    let onlyImageFrames = framesData.filter(function(item){
        return item.type === "ImageCard";
    })
        
    let imageSlider = createElement("div", undefined, "imageSlider");
    bannerArea.appendChild(imageSlider);
        
    //imageSlider.addEventListener('scroll', updateOnImageSliderScroll);
    imageSlider.addEventListener('scroll', scrollStopper);

    // Dots
    let dotsView = createElement("div","dots-wrapper");
    let w = onlyImageFrames.length * 28;
    dotsView.style.width = `${w}px`;
    bannerArea.appendChild(dotsView);
        
    // Fill slider and populate dots
    for (let i = 0; i < onlyImageFrames.length; i++) {
        let frData = onlyImageFrames[i];
        let banner = createElement("img","banner");
        banner.src = landscapeMode ?  frData.imageLandscapeUrl : frData.imagePortraitUrl;
        imageSlider.appendChild(banner);
        
        let dotView = createElement("img","dot",`d${i}`);
        dotView.src = "https://files.mobidriven.com/players/promo/images/dot.png";
        dotsView.appendChild(dotView);
        if (i === 0) {
          dotView.src = "https://files.mobidriven.com/players/promo/images/dot_black.png";
        }
    }
                 

    // Buttons
    let buttonsContainer = createElement("div","buttons-container");
    buttonsArea.appendChild(buttonsContainer);

    createButton("Перейти", 0, true);
    let canCall = mraid.supports && mraid.supports("tel");
    createButton("Позвонить", 1, canCall);
    let canSaveImage = mraid.supports && mraid.supports("storePicture");
    createButton("Сохранить", 2, canSaveImage);


    function createButton(title, ind, enabled) {
        var image = undefined;
        switch (ind) {
          case 0:
            image = "https://files.mobidriven.com/players/promo/images/link.png";
            break;
          case 1:
            image = "https://files.mobidriven.com/players/promo/images/call.png";
            break;
          case 2:
            image = "https://files.mobidriven.com/players/promo/images/download.png";
            break;
          default:
            break;
        }

        let button = createElement("div","button");
        if (enabled) {
            button.addEventListener("click", function(event) {
              switch (ind) {
                case 0:
                    clickAction(index, true);
                  break;
                case 1:
                    callAction(index);
                  break;
                case 2:
                  saveAction(index);
                  break;
                default:
                  break;
              }
            });
        }
        
        buttonsContainer.appendChild(button);
        
        let wrapper = createElement("div", "button-wrapper");
        var buttonImage = createElement("img");
        buttonImage.src = image;
        wrapper.appendChild(buttonImage);

        let buttonText = createElement("p");
        buttonText.textContent = title;
        wrapper.appendChild(buttonText);
        
        button.appendChild(wrapper);
        
        if (!enabled) {
            buttonImage.style.opacity = 0.5;
            buttonText.style.opacity = 0.5;
        }
    }

    //Promocode
    let promo = createElement("img","promo");
    promo.src = data.buttonStoreUrl;
    buttonsContainer.appendChild(promo);

        
        
    // Overlays
    let overlayView = createElement("div","overlayView");
    overlayView.style.flexDirection = "row";
    frameView.appendChild(overlayView);

    let leftButtonsContainer = createElement("div","leftButtonsContainer");
    overlayView.appendChild(leftButtonsContainer);

    // GG Logo
    let logo = createElement("img","logoGG");
    logo.className = 'logoGG';
    logo.src = "https://files.mobidriven.com/players/promo/images/gg.png";
    logo.addEventListener("click", function(event) {
        clickAction(index,false);
    });
    leftButtonsContainer.appendChild(logo);

    let rightButtonsContainer = createElement("div","rightButtonsContainer");
    overlayView.appendChild(rightButtonsContainer);

    // Swipe button
    if (framesDataReformated.length > 1 && index == 0) {
        let swipeButtonView = createElement("img","swipe");
        swipeButtonView.src = "https://files.mobidriven.com/players/promo/images/swipe.png";
        rightButtonsContainer.appendChild(swipeButtonView);
    }
    
}

var isInViewport = function (elem) {
    var bounding = elem.getBoundingClientRect();
    let res = parseInt(bounding.left)
    return res === 0
};
                           
                           
var delayedExec = function(after, fn) {
   var timer;
   return function() {
       timer && clearTimeout(timer);
       timer = setTimeout(fn, after);
   };
};
                           
var scrollStopper = delayedExec(150, function() {
    updateOnImageSliderScroll();
});
                           
function updateOnImageSliderScroll() {
    let sliderView = document.getElementById("imageSlider");
    let images = document.getElementsByClassName("banner");
    if (images.length>0) {
        let firstImage = images[0];
        let imageWidth = firstImage.offsetWidth;
        
        let ind = Math.round(sliderView.scrollLeft / imageWidth);
        
        Array.prototype.forEach.call(document.getElementsByClassName('dot'), function(element) {
            element.src = "https://files.mobidriven.com/players/promo/images/dot.png";
        });
        
        let dotView = document.getElementById(`d${ind}`);
        if (dotView) {
            dotView.src = "https://files.mobidriven.com/players/promo/images/dot_black.png";
        }
        
        // SCROLL TO SELECTED
        sliderView.scrollTo(imageWidth * ind, 0);
    }
}


function updateOnSwipe() {
  let frames = document.getElementsByClassName("frameView");
  
  visibleFrameIndex = -1

  Array.prototype.forEach.call(frames, function(frame) {
    if (isInViewport(frame)) {
      visibleFrameIndex = frame.id;
    }
  })

  if (visibleFrameIndex>-1) {
      console.log("visibleFrameIndex: " + visibleFrameIndex);
      
     // updateCloseButton
      let closeButtonContainer = document.getElementById("closeButtonContainer");
      let closeButton = document.getElementById("closeButton");
      if (closeButton) {
          let visibleFrame = framesDataReformated[visibleFrameIndex];
          var closeButtonImage = "https://files.mobidriven.com/players/promo/images/close_rect.png";
          if (visibleFrame) {
              if (visibleFrame.type == "ImageCard") {
                  closeButtonImage = "https://files.mobidriven.com/players/promo/images/close.png";
                  closeButton.classList.remove("closeButton");
                  closeButton.classList.add("closeButtonBanner");
                  
                  closeButtonContainer.style.top = "20px";
              }
              else {
                  closeButton.classList.remove("closeButtonBanner");
                  closeButton.classList.add("closeButton");
                  
                  closeButtonContainer.style.top = "10px";
              }
          }
          closeButton.src = closeButtonImage;
          
          // Update counter if exist
          let counter = document.getElementById("closeButtonCounterLabel");
          if (counter) {
              counter.style.marginRight = visibleFrame.type == "ImageCard" ? "60px" : "20px";
          }
          
      }
      
      
      
    // Update video players
    let videoViews = document.getElementsByClassName("videoView");
    Array.prototype.forEach.call(videoViews, function(video) {
        video.pause();
    })

    let video = document.getElementById(`video-${visibleFrameIndex}`);
    if (video) {
      if (video.paused || video.ended) {
          video.play();
          if (video.muted) {
              video.click();
          }
      } else {
          video.pause();
      }
    }

    // Create event
    startAction(visibleFrameIndex);
  }
}


// Update player on isViewable state change
function updateVisiblePlayerState(){
    let video = document.getElementById(`video-${visibleFrameIndex}`);
    if (video && isInViewport(video)){
        if (mraid.isViewable() == true) {
          if (video.paused || video.ended) {
              video.play();
          }
          else {
              video.pause();
          }
        }
        else {
            video.pause();
        }
    }
}

// Update UI on orientaion change
function updateUI() {
    if (document.getElementById(swipeViewId) == undefined) {return}
    
    if (typeof mraid.getScreenSize === "function") {
        let size = mraid.getScreenSize();
        landscapeMode = size.width > size.height;
    }
        
    // Image frames
    let imageSlider = document.getElementById("imageSlider");
    if (imageSlider) {
        imageSlider.innerHTML = "";
        let onlyImageFrames = framesData.filter(function(item){
            return item.type === "ImageCard";
        })
        
        for (let i = 0; i < onlyImageFrames.length; i++) {
            let frData = onlyImageFrames[i];
            let banner = createElement("img","banner");
            banner.src = landscapeMode ?  frData.imageLandscapeUrl : frData.imagePortraitUrl;
            imageSlider.appendChild(banner);
        }
    }
        
    if (typeof mraid.getBigScreen === "function") {
        let bigScreen =  mraid.getBigScreen();
        
        // Update view size for iOS
        let swipeView = document.getElementById(swipeViewId);
        if (bigScreen) {
            calculateViewSizeForIOS(swipeView);
        }
        
        Array.prototype.forEach.call(document.getElementsByClassName('frameView'), function(element) {
            if (bigScreen) {
                calculateViewSizeForIOS(element);
            }
        });
        
        // Update close button container
        let closeBtnContainer = document.getElementById("closeButtonContainer");
        if (closeBtnContainer && bigScreen === true && landscapeMode === true) {
            closeBtnContainer.style.right = "5px";
        }
        else {
            closeBtnContainer.style.right = 0;
        }
    }
        
    // Update video frames
    players.forEach(function (player){
        player.update(landscapeMode);
    })
}
     
                           
// Actions

function startAction(index) {
    if (!mraid.isViewable()) {return;}
    
    var frameData = framesDataReformated[index];
        
    if (frameData["started"] === true) {
        return;
    }
    frameData["started"] = true;
    framesDataReformated[index] = frameData;

    var event = {};
    event.type = "start";
    event.urls = [];
    frameData.eventTracking.forEach(function (ev){
        if (ev.event === event.type) {
            event.urls.push(ev.url);
        }
    })
    fireEvent(event);
        
    if (frameData.type === "ImageCard") {
        setTimeout(impressionAction, frameData.impTrackingTimeout, frameData.impTracking);
    }
}

const impressionAction = urls => {
  var event = {};
  event.type = "impression";
  event.urls = urls;
  fireEvent(event);
};


function closeAction(index) {
   // Pause visible video
   var video = undefined;
   let visibleFrame = framesDataReformated[visibleFrameIndex];
   if (visibleFrame.type === "VideoPlayer") {
       let vid = document.getElementById(`video-${visibleFrameIndex}`);
       if (vid && isInViewport(vid)){
           video = vid;
       }
   }
   if (video) {video.pause();}
       
   if (mraid.supports && mraid.supports("sdk") && rewardCounter) {
       const alert = new AlertView({
           containerId:"promo",
           onOk:() => {
               close(index);
           },
           onCancel:()=> {
               if (myCounter) {myCounter.resume();}
               if (video && !video.ended) {video.play();}
           }
       })
       alert.show();
       if (myCounter) {myCounter.pause();}
   }
   else {
       close(index);
   }
}
                           
function close(index) {
    // For rewarded ad
    if (typeof mraid.getRewarded === "function" && mraid.getRewarded() === true && typeof mraid.rewardReceived === "function" ){
        mraid.rewardReceived(rewardCounter === undefined)
    }
        
        
    let frameData = framesDataReformated[index];
    var event = {};
    event.type = "close";
    event.urls = [];
    frameData.eventTracking.forEach(function (ev){
        if (ev.event === event.type) {
          event.urls.push(ev.url);
        }
    })

    fireEvent(event);
}
                           

function clickAction(index, buttonClick) {
  let frameData = framesDataReformated[index];
  var event = {};
  event.type = "click";
  let link = buttonClick ? frameData.buttonClickUrl : frameData.clickUrl;
  event.value = link;
  event.urls = [];
  frameData.clickTracking.forEach(function (clickUrl){
      event.urls.push(clickUrl);
  })
  fireEvent(event);
}

function callAction(index) {
  let frameData = framesDataReformated[index];
  var event = {};
  event.type = "call";
  event.value = frameData.buttonCallPhone;
  fireEvent(event);
}

function saveAction(index) {
  let frameData = framesDataReformated[index];
  var event = {};
  event.type = "save";
  event.value = frameData.buttonStoreUrl;
  fireEvent(event);
}

function fireEvent(event) {
    console.log("EVENT: " + event.type);
    if (event.urls && event.urls.length>0){
        pushToServer(event.urls)
    }
    
    if (event.type === "close") {
        mraid.unload();
        return;
    }
    
    if (!event.value){return}
    //console.log("Implement in MRAID:: " + event.type + ": " + event.value);
    switch (event.type) {
        case "click":
            mraid.open(event.value);
            break;
        case "save":
            mraid.storePicture(event.value)
            break;
        case "call":
            let numberUrl = "tel://" + event.value.replace(/\D/g,'');
            mraid.open(numberUrl);
            break;
        default:
            break;
    }
}

function pushToServer(urls) {
    urls.forEach(function (url){
        send(url);
    })
}

function send(url) {
    let xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.send();
    xhr.onload = function() {
        if (xhr.status != 200) {
            console.log(`Failed send pixel: ${xhr.status}, ${xhr.statusText}`);
        } else {
            //console.log("Send pixel - OK, URL: " + url);
        }
    };

    xhr.onerror = function() {
        console.log("Failed send pixel");
    };
}

handleUploadVideo(videofile, uploadingFeed) {
    const promise = new Promise((resolve, reject) => {
      this.videoUploader = CommonServices.uploadChunkFile(videofile);
      this.videoUploader.onProgress = progress => {
        if (this.props.handleUploadProgressCallback && uploadingFeed) {
          this.handleProgressCallback(progress, uploadingFeed.id);
        }
      };
      this.videoUploader.onComplete = src => {
        resolve(src);
      };
      this.videoUploader.onError = err => {
        if (err.message.indexOf('canceled') !== -1) {
          resolve('canceled');
        } else {
          resolve(null);
        }
      };
    });
    return promise;
  }
// note that we use uri for ios and use path for android (using react-native-image-picker)

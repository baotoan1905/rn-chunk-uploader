import RNFetchBlob from 'rn-fetch-blob';

/*
 * const chunkUploader = new ChunkUploader();
 * chunkUploader.onProgress = function(progress) {}
 * chunkUploader.onStart = function()
 * */

class ChunkUploader {
  constructor(props) {
    if (props) {
      this.chunkSize = props.chunkSize || 1 * 1024 * 1024;
      this.file = props.file;
      this.onProgress = () => {};
      this.onComplete = () => {};
      this.onError = () => {};
    }
    this.rnFetchBlob = null;
  }

  start() {
    if (this.onStart) {
      this.onStart();
    } else {
      console.log('Please declare onStart callback func before calling start func');
    }
  }

  upload(method, target, headers, sessionId) {
    console.log('sessionId', sessionId);
    const { file, chunkSize } = this;
    let chunkNumber = 1;
    let readBytes = 0;
    let totalUploaded = 0;
    let from = 0;
    let to = 0;
    let totalProgress = 0;
    let currentChunkProgress = 0;
    const resumableIdentifier = `${file.size}-${file.name.replace(/\./g, '')}`;
    const resumableTotalChunks = Math.ceil(file.size / chunkSize);
    const uploadNextChunk = uploaded => {
      totalUploaded += uploaded;

      if (file.size === totalUploaded) {
        file.close();
      } else {
        const chunk = Math.min(file.size - readBytes, chunkSize);
        const blob = file.slice(readBytes, readBytes + chunk);
        console.log('blob', blob);
        readBytes += chunk;
        from = to;
        to = from + chunk;

        const url = `${target}?chunkNumber=${chunkNumber}&chunkSize=${chunk}&totalSize=${file.size}&resumableType=${file.type}&resumableIdentifier=${resumableIdentifier}&fileName=${file.name}&resumableRelativePath=${file.name}&resumableTotalChunks=${resumableTotalChunks}`;

        const data = [
          {
            name: 'chunkNumber',
            data: `${chunkNumber}`,
          },
          {
            name: 'chunkSize',
            data: `${chunk}`,
          },
          {
            name: 'totalSize',
            data: `${file.size}`,
          },
          {
            name: 'resumableType',
            data: `${file.type}`,
          },
          {
            name: 'resumableIdentifier',
            data: `${resumableIdentifier}`,
          },
          {
            name: 'fileName',
            data: `${file.name}`,
          },
          {
            name: 'resumableRelativePath',
            data: `${file.name}`,
          },
          {
            name: 'resumableTotalChunks',
            data: `${resumableTotalChunks}`,
          },
        ];

        blob.onCreated(slicedBlob => {
          // get path of sliced blob object
          const path = blob.getRNFetchBlobRef();

          data.push({
            name: 'file',
            filename: file.name,
            data: RNFetchBlob.wrap(path),
          });
          currentChunkProgress = 0;
          this.rnFetchBlob = RNFetchBlob.fetch(method, url, headers, data).uploadProgress(
            (written, total) => {
              const progress = written / total;
              const increaseProgress = progress - currentChunkProgress;
              totalProgress += increaseProgress / resumableTotalChunks;
              currentChunkProgress = progress;
              this.onProgress(Math.round(totalProgress * 100) / 100);
            }
          );
          this.rnFetchBlob
            .then(resp => {
              if (resp) {
                return resp.json();
              }
              return null;
            })
            .then(resp => {
              if (resp.progress < 1) {
                chunkNumber += 1;
                uploadNextChunk(to - from);
              } else {
                this.onProgress(1);
                this.onComplete(resp.src);
              }
            })
            .catch(err => {
              console.log('ERROR Upload chunk', err);
              this.onError(err);
            });
        });
      }
    };
    // start uploading
    uploadNextChunk(0);
  }

  cancel() {
    if (this.rnFetchBlob) {
      this.rnFetchBlob.cancel();
    }
  }
}

export default ChunkUploader;

export function uploadChunkFile(file) {
  const token = store.getState().token.access_token;
  const instanceId = store.getState().currentInstance.id;
  const chunkUploader = new ChunkUploader({});
  const Blob = RNFetchBlob.polyfill.Blob;
  Blob.build(RNFetchBlob.wrap(file.uri), { type: file.type }).then(blobFile => {
    const chunkSize = 1 * 1024 * 1024;
    chunkUploader.chunkSize = chunkSize;
    chunkUploader.file = Object.assign(blobFile, { name: file.name });
    chunkUploader.onStart = () => {
      const data = {
        chunkSize: Math.min(chunkSize, blobFile.size),
        totalSize: blobFile.size,
        fileName: file.name || 'noname',
        fileCategoryType: file.fileCategoryType || null,
        feature: file.feature || null,
      };
      Api.post(
        ENDPOINT.CHUNK_UPLOAD.CREATE_SESSION,
        data,
        {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          Authorization: `bearer ${token}`,
        },
        true,
        true
      ).then(({ sessionId }) => {
        const headers = {
          Authorization: `bearer ${token}`,
          Instance: `${instanceId}`,
          'Content-Type': 'multipart/form-data',
        };
        chunkUploader.upload('PUT', ENDPOINT.CHUNK_UPLOAD.UPLOAD(sessionId), headers, sessionId);
      });
    };
    chunkUploader.start();
  });
  return chunkUploader;
}

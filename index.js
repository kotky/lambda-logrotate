var S3Zipper = require ('aws-s3-zipper');
exports.handler = function (event, context) {
  var source_folder = "/"
  var zip_folder = ""
  var filterByName = false
  var include_subfolders=false
  var region = process.env.BUCKET_REGION
  var bucket = process.env.BUCKET_NAME
  if (process.env.BUCKET_SOURCE_FOLDER)
    source_folder=process.env.BUCKET_SOURCE_FOLDER 
  if (process.env.BUCKET_ZIP_FOLDER)
    zip_folder=process.env.BUCKET_ZIP_FOLDER
  if (process.env.INCLUDE_BY_FILENAME)
    filterByName=process.env.INCLUDE_BY_FILENAME
  if (process.env.BUCKET_SOURCE_INCLUDE_SUBFOLDERS === 'true')
    include_subfolders=true

  var config ={
      accessKeyId: process.env.BUCKET_IAM_ACCESS_KEY_ID,
      secretAccessKey: process.env.BUCKET_IAM_SECRET_ACCESS_KEY,
      region: region,
      bucket: bucket
  };

  var zipper = new S3Zipper(config);
  console.log("started preparations")
  console.log(process.env)
  if (filterByName){
    zipper.filterOutFiles= function(file){
      console.log(file)
      if(file.Key.indexOf(filterByName) >= 0) // zip only filterByName files
          return file;
      else 
        return null;
    };
  }

  var date = new Date()
  var filename='backup-logger-logs-'+date.toISOString()+'.zip'
  /// if no path is given to S3 zip file then it will be placed in the same folder
  zipper.zipToS3File ({
          s3FolderName: source_folder,
          s3ZipFileName: zip_folder+filename,
          recursive: include_subfolders,
          zipFileName: "/tmp/__" + Date.now() + '.zip'
      },function(err,result){
          if(err)
              console.error(err);
          else{
              var lastFile = result.zippedFiles[result.zippedFiles.length-1];
              if(lastFile)
                  console.log('last key ', lastFile.Key); // next time start from here
          }
  });
}
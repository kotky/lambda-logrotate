var fs = require('fs')
var AWS = require('aws-sdk')
var s3Zip = require('s3-zip')
var XmlStream = require('xml-stream')
AWS.config.update({accessKeyId: process.env.BUCKET_IAM_ACCESS_KEY_ID, secretAccessKey: process.env.BUCKET_IAM_SECRET_ACCESS_KEY, region: process.env.BUCKET_REGION});
exports.handler = function (event, context) {
  var source_folder = ""
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
   
  var s3 = new AWS.S3()
  var params = {
    Bucket: bucket
  }
   
  var filesArray = []
  var files = s3.listObjects(params).createReadStream()
  var xml = new XmlStream(files)
  xml.collect('Key')
  xml.on('endElement: Key', function(item) {
    if (filterByName && item['$text'].indexOf(filterByName)>-1)
      filesArray.push(item['$text'])
  })
   
  xml
    .on('end', function () {
      zip(filesArray)
    })
   
  function zip(files) {
    // Create body stream
    console.log(files)
    try {

      var body = s3Zip.archive({ region: region, bucket: bucket}, source_folder, files)
      var zip_filename = "__"+new Date()+"logger.zip"
      var zipParams = { params: { Bucket: bucket, Key: zip_folder + zip_filename } }
      var zipFile = new AWS.S3(zipParams)
      zipFile.upload({ Body: body })
        .on('httpUploadProgress', function (evt) { console.log(evt) })
        .send(function (e, r) { 
          if (e) {
            var err = 'zipFile.upload error ' + e
            console.log(err)         
            context.fail(err)
          } 
          console.log(r) 
          context.succeed(r)
        })

    } catch (e) {
      var err = 'catched error: ' + e
      console.log(err)    
      context.fail(err)
    }
  }
}
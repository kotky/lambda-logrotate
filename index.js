var AWS = require('aws-sdk')
var s3Zip = require('s3-zip')
var XmlStream = require('xml-stream')

exports.handler = function (event, context) {
  var region = process.env.BUCKET_REGION
  var bucket = process.env.BUCKET_NAME
  var folder = process.env.BUCKET_FOLDER_NAME
  var s3 = new AWS.S3({ region: region })
  var params = {
    Bucket: bucket,
    Prefix: folder
  }
  var filesArray = []
  var files = s3.listObjects(params).createReadStream()
  var xml = new XmlStream(files)
  xml.collect('Key')
  xml.on('endElement: Key', function(item) {
    if (item['$text'].indexOf('logger.log')>-1)
      filesArray.push(item['$text'])
  })
   
  xml.on('end', function () {
    zip(filesArray)
  })
   
  function zip(files) {
    console.log(files)
    var date = new Date()
    var filename='backup-logger-logs-'+date.toISOString()+'.zip'
    var body = s3Zip.archive({ region: region, bucket: bucket }, folder, files)
    s3.upload({
      Key: 'backups/'+filename,
      Body: output
    }, function(err, data) {
      if (err) {
        return console.log('There was an error while uploading: ', err.message);
        context.fail(err)
      }
      console.log(data)
      context.succeed(data)
    });
  }
}
/* jshint node: true*/
"use strict";

var fs = require("fs");
var JSZip = require("jszip");

var file = fs.existsSync(process.argv.slice(2)[0]) ? process.argv.slice(2)[0] : null;
if (file) {
  clean(file);
} else {
  console.log("Watching folder...");
  fs.watch(".", function (event, file) {
    // TODO Work on overwrite
    if (event === "rename" && /\.epub/i.test(file.slice(-5)) && fs.existsSync(file)) {
      clean(file);
    }
  });
  return;
}

function clean (file) {
  var content, title, toc;

  // Read a zip file
  fs.readFile(file, function(err, data) {
    if (err) throw err;
    JSZip.loadAsync(data).then(function (zip) {
      
      content = zip.file("OEBPS/text/content.xhtml").async("text").then(function (fileData) {
        // Strip out donation box
        return fileData.replace(/<div.*id=\"donate\".*<\/div>/g, "");
      });
      // binary: false option for character encoding issue
      zip.file("OEBPS/text/content.xhtml", content, {binary: false});

      title = zip.file("OEBPS/text/title.xhtml").async("text").then(function (fileData) {
        // Comment out URL 
        return fileData.replace(/\t+(<h\d.*href[^>]*>[\s\S]*?<\/h\d>)/g, "\t\t<!-- $1 -->")
        // Strip out dotEPUB logo
        .replace(/\t+<div.*img[^>]*>([\s\S]*?)<\/div>\n/g, "");
      });
      zip.file("OEBPS/text/title.xhtml", title, {binary: false});
      // Remove unused dotepub.png
      zip.remove("OEBPS/img/dotepub.png");

      toc = zip.file("OEBPS/toc.ncx").async("text").then(function (fileData) {
        // Strip out disclaimer section from TOC
        return fileData.replace(/\t+<navPoint.*playOrder=\"3\"[^>]*>([\s\S]*?)<\/navPoint>\n\n/g, "");
      });
      zip.file("OEBPS/toc.ncx", toc, {binary: false});
      // Strip out copyright file entirely
      zip.remove("OEBPS/text/copy.xhtml");
      
      zip
      .generateNodeStream({
        type:"nodebuffer",
        streamFiles: true,
        compression: "DEFLATE",
        compressionOptions: {
          // 1 = best speed, 9 = best compression
          level: 6
        }
      })
      .pipe(fs.createWriteStream(file))
      .on("finish", function () {
          // JSZip generates a readable stream with a "end" event,
          // but is piped here in a writable stream which emits a "finish" event.
          console.log(file + " cleaned!");
      });
    });
  });  
}

//Code below refer from lecture, Mikhail Timofeev
var http = require('http'), 
    path = require('path'), 
    express = require('express'), 
    fs = require('fs'), 
    xmlParse = require('xslt-processor').xmlParse, 
    xsltProcess = require('xslt-processor').xsltProcess, 
    xml2js = require('xml2js'); 

var router = express(); 
var server = http.createServer(router); 

router.use(express.static(path.resolve(__dirname, 'views'))); 
router.use(express.urlencoded({extended: true})); 
router.use(express.json()); 

// Function to read in XML file and convert it to JSON
function xmlFileToJs(filename, cb) {
  var filepath = path.normalize(path.join(__dirname, filename));
  fs.readFile(filepath, 'utf8', function(err, xmlStr) {
    if (err) throw (err);
    xml2js.parseString(xmlStr, {}, cb);
  });
}

//Function to convert JSON to XML and save it
function jsToXmlFile(filename, obj, cb) {
  var filepath = path.normalize(path.join(__dirname, filename));
  var builder = new xml2js.Builder();
  var xml = builder.buildObject(obj);
  fs.unlinkSync(filepath);
  fs.writeFile(filepath, xml, cb);
}

router.get('/', function(req, res){

    res.render('index');

})

router.get('/get/html', function(req, res) {

    res.writeHead(200, {'Content-Type': 'text/html'}); 

    var xml = fs.readFileSync('CasaPepe.xml', 'utf8'); //We are reading in the XML file
    var xsl = fs.readFileSync('CasaPepe.xsl', 'utf8'); //We are reading in the XSL file
    var doc = xmlParse(xml); //Parsing our XML file
    var stylesheet = xmlParse(xsl); //Parsing our XSL file

    var result = xsltProcess(doc, stylesheet); //Execute Transformation

    res.end(result.toString()); //We render the result back to the user converting it to a string before serving


});

// POST request to add to JSON & XML files
router.post('/post/json', function(req, res) {

  // Function to read in a JSON file, add to it & convert to XML
  function appendJSON(obj) {
    // Function to read in XML file, convert it to JSON, add a new object and write back to XML file
    xmlFileToJs('CasaPepe.xml', function(err, result) {
      if (err) throw (err);
      //This is where you pass on information from the form inside index.html in a form of JSON and navigate through our JSON (XML) file to create a new entree object
      result.restaurantmenu.section[obj.sec_n].entree.push({'item': obj.item, 'price': obj.price}); //If your XML elements are differet, this is where you have to change to your own element names
      //Converting back to our original XML file from JSON
      jsToXmlFile('CasaPepe.xml', result, function(err) {
        if (err) console.log(err);
      })
    })
  };

  // Call appendJSON function and pass in body of the current POST request
  appendJSON(req.body);

  // Re-direct the browser back to the page, where the POST request came from
  res.redirect('back');

});

// POST request to add to JSON & XML files
router.post('/post/delete', function(req, res) {

  // Function to read in a JSON file, add to it & convert to XML
  function deleteJSON(obj) {
    // Function to read in XML file, convert it to JSON, delete the required object and write back to XML file
    xmlFileToJs('CasaPepe.xml', function(err, result) {
      if (err) throw (err);
      //This is where we delete the object based on the position of the section and position of the entree, as being passed on from index.html
      delete result.restaurantmenu.section[obj.section].entree[obj.entree];
      //This is where we convert from JSON and write back our XML file
      jsToXmlFile('CasaPepe.xml', result, function(err) {
        if (err) console.log(err);
      })
    })
  }

  // Call appendJSON function and pass in body of the current POST request
  deleteJSON(req.body);

});

//This is where we as the server to be listening to user with a specified IP and Port
server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function() {
  var addr = server.address();
  console.log("Server listening at", addr.address + ":" + addr.port);
});
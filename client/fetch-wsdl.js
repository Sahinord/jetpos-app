const fs = require('fs');
fetch('https://portaltest.qnbesolutions.com.tr/earsiv/ws/EarsivWebService?wsdl')
    .then(r => r.text())
    .then(t => {
        fs.writeFileSync('wsdl.xml', t);
        console.log(t.substring(0, 200));
    });

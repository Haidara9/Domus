import fs from 'node:fs';
if(!fs.existsSync('app/reference-sheets.json')){fs.writeFileSync('app/reference-sheets.json','{}\n');console.log('Private reference contact sheets are not present. Import only into the private deployment checkout.');}

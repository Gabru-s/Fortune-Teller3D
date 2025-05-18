const express =require("express");
const app = express();
app.use(express.static(__dirname));
app.listen(3010,()=>{
console.log("Server running at http://103.99.202.191:3010");
});


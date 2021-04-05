const config     = require("config");
const mongoose   = require("mongoose");
const express    = require("express");
const bodyParser = require("body-parser");
const noteRoute  = require("./routes/note");
const cors       = require('cors')

const app        = express();

const port       = config.get("port");
const dbUrl      = config.get("dbUrl");


mongoose.connect(
    dbUrl, 
    {useNewUrlParser: true, useUnifiedTopology: true}
).then(() => {
    console.log("DB connected");
}).catch(e => {
    console.log("Error: " + e);
})

app.use(bodyParser.json());
app.use(cors());

app.use("/", noteRoute);

app.listen(port, () => {
    console.log(`Listening to port ${port}....`);
});
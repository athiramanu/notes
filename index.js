const mongoose = require("mongoose");
const express = require("express");
const bodyParser = require("body-parser");

const app = express();
const port = 3000;

const noteRoute = require("./routes/note");

mongoose.connect(
    'mongodb://127.0.0.1/my_database', 
    {useNewUrlParser: true, useUnifiedTopology: true}
).then(() => {
    console.log("DB connected");
}).catch(e => {
    console.log("Error: " + e);
})

app.use(bodyParser.json()); 

app.use("/", noteRoute);

app.listen(port, () => {
    console.log("Listening....");
});
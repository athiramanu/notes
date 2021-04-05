var mongoose = require("mongoose");

const noteSchema = new mongoose.Schema({
    name : {
        type: String,
        maxlength: 32
    },
    text: {
        type: String,
        maxlength: 10000
    }
});

module.exports = mongoose.model("Note", noteSchema);
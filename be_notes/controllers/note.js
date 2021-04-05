const Note = require("../models/note");
const maxNoteLength = 10000;
const maxRecords = 1000;

let returnError = (res) => {
    res.status(400).json({
        "Error": "Something went wrong"
    });
};

let deleteNote = (res) => {
    Note.findOne().sort({created_at: -1}).exec((err, note) => {
        Note.deleteOne(note);
    });
};

let makeMemory = (res) => {
    Note.count({}, (err, count) => {
        if (count > maxRecords) {
            deleteNote(res);
        }
    })
}

let createNote  = (res, name) => {
    makeMemory(res);
    let newNote = new Note({name: name, text: ''});
    newNote.save((err, note) => {
        if (err) {
            returnError(res)
        } else {
            res.status(200).json({"text": note.text});
        }
    });
};

let trimText = (text) => {
    if (text.length <= maxNoteLength) 
        return text;
    return text.substring(0, maxNoteLength);
}

exports.getNoteName = (req, res, next, id) => {
    req.note = id;
    next();
};

exports.getNote = (req, res) => {
    let name = req.note;
    Note.find({name: name}).exec((err, note) => {
        if (err) {
            returnError(res);
        } else if(note.length == 0) {
            createNote(res, name);
        } else {
            note = note[0];
            res.status(200).json({"text": note.text });
        }
    });
};

exports.saveNote = (req, res) => {
    let name = req.note;
    let text = trimText(req.body.text);

    Note.findOneAndUpdate(
        {name: name},
        { $set: { "text" : text } },
        {new: true}
    ).exec((err, note) => {
        if (err) {
            returnError(res);
        } else {
            res.status(200).json({
                "text": note.text
            });
        }
    })
};
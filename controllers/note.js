const Note = require("../models/note");

let returnError = (res) => {
    res.status(400).json({
        "Error": "Something went wrong"
    });
};

let createNote  = (res, name) => {
    let newNote = new Note({name: name, text: ''});
    newNote.save((err, note) => {
        if (err) {
            returnError(res)
        } else {
            res.status(200).json(note);
        }
    });
};

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
            res.json(note);
        }
    });
};

exports.saveNote = (req, res) => {
    let name = req.note;
    
};

exports.loadHome = (req, res) => {
    res.send("meeeeee");
};
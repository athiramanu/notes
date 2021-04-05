const express = require("express");
const router = express.Router();
const {getNoteName, getNote, saveNote} = require("../controllers/note");

router.param('note', getNoteName);

router.get("/:note", getNote);

router.post("/:note", saveNote);

module.exports = router;
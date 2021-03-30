const express = require("express");
const router = express.Router();
const {loadHome, getNoteName, getNote, saveNote} = require("../controllers/note");

router.param('note', getNoteName);

router.get("/:note", getNote);
router.get("/", loadHome);

router.post("/:note", saveNote);

module.exports = router;